import { Injectable, NotFoundException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { Booking } from '../bookings/entities/booking.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { BookingsService } from '../bookings/bookings.service';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
  ) {}

  async initiatePayment(bookingId: string) {
    const booking = await this.bookingRepository.findOne({ 
      where: { id: bookingId },
      relations: ['student', 'hostel'] 
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.PENDING) {
        // In theory it should be APPROVED, but we allow PENDING for now if flow requires
    }

    const amount = booking.totalFirstMonth;
    const commissionRate = await this.bookingsService.getCommissionRate();
    const commissionPkr = Math.round((amount * commissionRate) / 100);
    const payoutPkr = amount - commissionPkr;

    // Create or update payment record
    let payment = await this.paymentRepository.findOne({ where: { bookingId } });
    if (!payment) {
      payment = this.paymentRepository.create({
        bookingId,
        studentId: booking.studentId,
        ownerId: booking.ownerId,
        hostelId: booking.hostelId,
        amountPkr: amount,
        commissionRate,
        commissionPkr,
        payoutPkr,
        status: PaymentStatus.PENDING,
        isTest: this.configService.get('PAYFAST_MODE') !== 'live',
      });
    } else {
      payment.status = PaymentStatus.PENDING;
    }
    await this.paymentRepository.save(payment);

    // PayFast Parameters
    const payfastData: any = {
      merchant_id: this.configService.get('PAYFAST_MERCHANT_ID'),
      merchant_key: this.configService.get('PAYFAST_MERCHANT_KEY'),
      return_url: `${this.configService.get('FRONTEND_URL')}/payment/success`,
      cancel_url: `${this.configService.get('FRONTEND_URL')}/payment/cancel`,
      notify_url: `${this.configService.get('BACKEND_URL')}/api/v1/payments/itn`,
      name_first: booking.student?.fullName?.split(' ')[0] || 'Student',
      email_address: booking.student?.email,
      m_payment_id: payment.id,
      amount: amount.toFixed(2),
      item_name: `Hostel Booking: ${booking.hostel?.name}`,
    };

    const signature = this.generateSignature(payfastData, this.configService.get('PAYFAST_PASSPHRASE'));
    payfastData.signature = signature;

    const payfastUrl = this.configService.get('PAYFAST_MODE') === 'live' 
      ? 'https://www.payfast.co.za/eng/process' 
      : 'https://sandbox.payfast.co.za/eng/process';

    return {
      url: payfastUrl,
      params: payfastData,
    };
  }

  async handleITN(data: any) {
    this.logger.log('Received PayFast ITN:', JSON.stringify(data));

    // 1. Validate signature
    const signature = data.signature;
    const pfData = { ...data };
    delete pfData.signature;
    const calculatedSignature = this.generateSignature(pfData, this.configService.get('PAYFAST_PASSPHRASE'));

    if (signature !== calculatedSignature) {
      this.logger.error('Invalid PayFast signature');
      return;
    }

    // 2. Process transaction
    const paymentId = data.m_payment_id;
    const payment = await this.paymentRepository.findOne({ where: { id: paymentId } });

    if (!payment) {
      this.logger.error(`Payment not found for ID: ${paymentId}`);
      return;
    }

    if (data.payment_status === 'COMPLETE') {
      payment.status = PaymentStatus.PAID;
      payment.paidAt = new Date();
      payment.paymentReference = data.pf_payment_id;
      payment.gatewayResponse = data;
      await this.paymentRepository.save(payment);

      // Use BookingsService to confirm and handle bed decrement
      try {
        await this.bookingsService.confirmBooking(payment.bookingId);
      } catch (err) {
        this.logger.error(`Failed to confirm booking ${payment.bookingId}: ${err.message}`);
      }
    } else if (data.payment_status === 'FAILED') {
      payment.status = PaymentStatus.FAILED;
      payment.gatewayResponse = data;
      await this.paymentRepository.save(payment);
    }

    return { status: 'ok' };
  }

  async getFinanceStats() {
    const payments = await this.paymentRepository.find({
        where: { status: PaymentStatus.PAID },
        order: { paidAt: 'DESC' },
        relations: ['student', 'hostel']
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPkr, 0);
    const platformFees = payments.reduce((sum, p) => sum + p.commissionPkr, 0);

    return {
      totalRevenue,
      platformFees,
      totalTransactions: payments.length,
      recentTransactions: payments.slice(0, 10).map(p => ({
        id: p.id,
        amount: p.amountPkr,
        fee: p.commissionPkr,
        student: p.student?.fullName,
        hostel: p.hostel?.name,
        date: p.paidAt,
      }))
    };
  }

  async getOwnerEarnings(ownerId: string) {
    const payments = await this.paymentRepository.find({
      where: { ownerId, status: PaymentStatus.PAID },
      order: { paidAt: 'DESC' },
      relations: ['student', 'hostel'],
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amountPkr, 0);
    const platformFees = payments.reduce((sum, p) => sum + p.commissionPkr, 0);
    const netPayout = payments.reduce((sum, p) => sum + p.payoutPkr, 0);

    return {
      totalRevenue,
      platformFees,
      netPayout,
      totalTransactions: payments.length,
      recentTransactions: payments.map(p => ({
        id: p.id,
        amount: p.amountPkr,
        fee: p.commissionPkr,
        payout: p.payoutPkr,
        student: p.student?.fullName || 'N/A',
        hostel: p.hostel?.name || 'N/A',
        date: p.paidAt,
        reference: p.paymentReference || 'N/A',
      })),
    };
  }

  private generateSignature(data: any, passphrase?: string): string {
    let getString = '';
    for (const key in data) {
      if (data.hasOwnProperty(key) && data[key] !== '' && key !== 'signature') {
        const val = typeof data[key] === 'string' ? data[key].trim() : data[key].toString();
        getString += `${key}=${encodeURIComponent(val).replace(/%20/g, '+')}&`;
      }
    }
    getString = getString.slice(0, -1);
    if (passphrase) {
      getString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
    }
    return crypto.createHash('md5').update(getString).digest('hex');
  }
}
