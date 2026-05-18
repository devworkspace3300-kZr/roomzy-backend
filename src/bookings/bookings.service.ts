import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { Hostel } from '../hostels/entities/hostel.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Payment } from '../payments/entities/payment.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { RoomAvailabilityStatus } from '../common/enums/room-availability-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Injectable()
export class BookingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Hostel)
    private readonly hostelRepository: Repository<Hostel>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  private readonly logger = new Logger(BookingsService.name);

  async onModuleInit() {
    await this.initSettingsTable();
  }

  private async initSettingsTable() {
    try {
      // 1. Create table if not exists
      await this.bookingRepository.query(`
        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL,
          description TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 2. Insert default commission rate if not exists
      const existing = await this.bookingRepository.query(`
        SELECT * FROM system_settings WHERE key = 'commission_rate'
      `);
      if (existing.length === 0) {
        await this.bookingRepository.query(`
          INSERT INTO system_settings (key, value, description)
          VALUES ('commission_rate', '10.0', 'Platform commission percentage applied to hostel bookings')
        `);
      }

      // 3. Insert default commission settings if not exists
      const existingSettings = await this.bookingRepository.query(`
        SELECT * FROM system_settings WHERE key = 'commission_settings'
      `);
      if (existingSettings.length === 0) {
        await this.bookingRepository.query(`
          INSERT INTO system_settings (key, value, description)
          VALUES ('commission_settings', '{"mode":"percentage","rate":10,"fixedFee":0}', 'Platform commission configuration JSON')
        `);
      }
    } catch (error) {
      this.logger.error('Failed to initialize system settings table', error);
    }
  }

  async getCommissionSettings(): Promise<{mode: string, rate: number, fixedFee: number}> {
    try {
      const res = await this.bookingRepository.query(`
        SELECT value FROM system_settings WHERE key = 'commission_settings'
      `);
      if (res && res.length > 0) {
        try {
          return JSON.parse(res[0].value);
        } catch (e) {}
      }

      // Fallback to old format
      const oldRes = await this.bookingRepository.query(`
        SELECT value FROM system_settings WHERE key = 'commission_rate'
      `);
      if (oldRes && oldRes.length > 0) {
        return { mode: 'percentage', rate: parseFloat(oldRes[0].value) || 10.0, fixedFee: 0 };
      }
    } catch (error) {
      this.logger.error('Failed to fetch commission rate from DB', error);
    }
    return { mode: 'percentage', rate: 10.0, fixedFee: 0 };
  }

  private isReservedState(status: BookingStatus): boolean {
    return [
      BookingStatus.APPROVED,
      BookingStatus.AWAITING_PAYMENT,
      BookingStatus.CONFIRMED,
      BookingStatus.ACTIVE_STAY
    ].includes(status);
  }

  async handleBedAllocation(roomId: string, oldStatus: BookingStatus, newStatus: BookingStatus): Promise<void> {
    const wasReserved = this.isReservedState(oldStatus);
    const isNowReserved = this.isReservedState(newStatus);

    if (wasReserved === isNowReserved) {
      return;
    }

    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) return;

    if (isNowReserved) {
      if (room.availableBeds <= 0) {
        throw new BadRequestException('All beds in this room are occupied.');
      }
      room.availableBeds = Math.max(0, room.availableBeds - 1);
      if (room.availableBeds <= 0) {
        room.availabilityStatus = RoomAvailabilityStatus.FULL;
      }
    } else {
      room.availableBeds = Math.min(room.totalBeds, room.availableBeds + 1);
      room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
    }
    await this.roomRepository.save(room);
  }

  async create(studentId: string, dto: CreateBookingDto): Promise<Booking> {
    const room = await this.roomRepository.findOne({ where: { id: dto.roomId }, relations: ['hostel'] });
    if (!room) throw new NotFoundException('Room not found');
    
    // Check if room is active and has beds
    if (!room.isActive || room.availableBeds <= 0 || room.availabilityStatus === RoomAvailabilityStatus.FULL) {
      throw new BadRequestException('Room is not available for booking');
    }

    // NEW: Prevent duplicate bookings
    const existingBooking = await this.bookingRepository.findOne({
      where: {
        studentId,
        roomId: dto.roomId,
        status: In([BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.CONFIRMED, BookingStatus.ACTIVE_STAY])
      }
    });
    if (existingBooking) {
      throw new BadRequestException('You already have an active or pending booking for this room');
    }

    const hostel = room.hostel;
    const moveIn = new Date(dto.moveInDate);
    const expectedEnd = new Date(moveIn);
    expectedEnd.setMonth(expectedEnd.getMonth() + dto.durationMonths);

    const booking = this.bookingRepository.create({
      studentId,
      ownerId: hostel.ownerId,
      hostelId: hostel.id,
      roomId: dto.roomId,
      moveInDate: moveIn,
      durationMonths: dto.durationMonths,
      expectedEndDate: expectedEnd,
      monthlyPrice: room.pricePerMonth,
      totalFirstMonth: room.pricePerMonth,
      status: BookingStatus.PENDING,
      notes: dto.notes,
    });

    return this.bookingRepository.save(booking);
  }

  async findMyBookings(studentId: string): Promise<any[]> {
    const bookings = await this.bookingRepository.find({
      where: { studentId },
      relations: ['hostel', 'room', 'hostel.images'],
      order: { createdAt: 'DESC' }
    });

    const reviews = await this.bookingRepository.query(`
      SELECT booking_id FROM reviews WHERE student_id = $1
    `, [studentId]);

    const reviewedBookingIds = new Set(reviews.map((r: any) => r.booking_id));

    return bookings.map(b => ({
      ...b,
      hasReview: reviewedBookingIds.has(b.id)
    }));
  }

  async findOwnerBookings(ownerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { ownerId },
      relations: ['hostel', 'room', 'student'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOwnerBookingsByStatus(ownerId: string, status?: BookingStatus): Promise<Booking[]> {
    const whereClause: any = { ownerId };
    if (status) {
      whereClause.status = status;
    }
    return this.bookingRepository.find({
      where: whereClause,
      relations: ['hostel', 'room', 'student'],
      order: { createdAt: 'DESC' }
    });
  }

  async getStudentProfile(bookingId: string, ownerId: string): Promise<any> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId, ownerId },
      relations: ['student']
    });
    
    if (!booking) throw new NotFoundException('Booking not found');
    
    const isApprovedOrLater = [
      BookingStatus.APPROVED, 
      BookingStatus.AWAITING_PAYMENT, 
      BookingStatus.CONFIRMED, 
      BookingStatus.ACTIVE_STAY, 
      BookingStatus.COMPLETED
    ].includes(booking.status);

    const student = booking.student;
    
    return {
      fullName: student.fullName,
      email: student.email,
      phone: isApprovedOrLater ? student.phone : 'Hidden before approval',
      // Return other student details as needed
    };
  }

  async getActiveStays(ownerId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { ownerId, status: BookingStatus.ACTIVE_STAY },
      relations: ['hostel', 'room', 'student'],
      order: { createdAt: 'DESC' }
    });
  }

  async checkoutActiveStay(bookingId: string, ownerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId, ownerId }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    
    if (booking.status !== BookingStatus.ACTIVE_STAY) {
      throw new BadRequestException('Booking is not an active stay');
    }

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    
    const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
    if (room) {
      room.availableBeds += 1;
      room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
      await this.roomRepository.save(room);
    }
    
    // Update active_stays record status to completed in database!
    try {
      const em = this.bookingRepository.manager;
      await em.query(
        `UPDATE active_stays SET status = 'completed', actual_end_date = $1 WHERE booking_id = $2`,
        [new Date(), booking.id]
      );
      this.logger.log(`Updated active stay checkout in database for booking ${booking.id}`);
    } catch (err) {
      this.logger.error(`Failed to update active stay checkout in database: ${err.message}`);
    }
    
    return this.bookingRepository.save(booking);
  }

  async ownerConfirmMoveIn(id: string, ownerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id, ownerId }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found or access denied');
    
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Booking must be confirmed before move-in can be processed');
    }

    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.ACTIVE_STAY);

    booking.status = BookingStatus.ACTIVE_STAY;
    booking.confirmedAt = booking.confirmedAt || new Date();
    const savedBooking = await this.bookingRepository.save(booking);

    // Create a record in raw SQL active_stays table to match database schema constraints!
    try {
      const em = this.bookingRepository.manager;
      const expectedEnd = booking.expectedEndDate || new Date();
      await em.query(
        `INSERT INTO active_stays (booking_id, student_id, owner_id, hostel_id, room_id, actual_move_in_date, expected_end_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
         ON CONFLICT (booking_id) DO NOTHING`,
        [booking.id, booking.studentId, booking.ownerId, booking.hostelId, booking.roomId, new Date(), expectedEnd]
      );
      this.logger.log(`Created active stay entry for booking ${booking.id}`);
    } catch (err) {
      this.logger.error(`Failed to create active stays database entry: ${err.message}`);
    }

    return savedBooking;
  }

  async findAll(): Promise<Booking[]> {
    return this.bookingRepository.find({
      relations: ['hostel', 'room', 'student', 'hostel.owner', 'hostel.images'],
      order: { createdAt: 'DESC' }
    });
  }

  async respondToBooking(id: string, ownerId: string, status: BookingStatus, rejectionReason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.ownerId !== ownerId) throw new ForbiddenException('Access denied');
    
    if (![BookingStatus.APPROVED, BookingStatus.REJECTED].includes(status)) {
      throw new BadRequestException('Invalid status for owner response');
    }

    if (status === BookingStatus.REJECTED && !rejectionReason) {
      throw new BadRequestException('Rejection reason is required');
    }

    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, status);

    if (status === BookingStatus.APPROVED) {
      booking.approvedAt = new Date();
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 24);
      booking.paymentDeadline = deadline;
    }
    if (status === BookingStatus.REJECTED) {
      booking.rejectionReason = rejectionReason || null;
    }

    booking.status = status;
    return this.bookingRepository.save(booking);
  }

  async ownerConfirmPayment(id: string, ownerId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id, ownerId }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found or access denied');
    
    if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.AWAITING_PAYMENT) {
      if (booking.status === BookingStatus.CONFIRMED) return booking;
      throw new BadRequestException('Booking must be approved before confirming payment');
    }

    return this.confirmBooking(id);
  }

  async confirmBooking(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    
    if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.AWAITING_PAYMENT) {
      // Allow confirmation if already confirmed (idempotency)
      if (booking.status === BookingStatus.CONFIRMED) return booking;
      throw new BadRequestException('Booking must be approved before confirmation');
    }

    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.CONFIRMED);

    booking.status = BookingStatus.CONFIRMED;
    booking.confirmedAt = new Date();
    const savedBooking = await this.bookingRepository.save(booking);

    // Create or update Payment Ledger Entry
    const existingPayment = await this.paymentRepository.findOne({ where: { bookingId: booking.id } });
    if (!existingPayment) {
      const commSettings = await this.getCommissionSettings();
      const grossPkr = booking.totalFirstMonth || booking.monthlyPrice || 0;
      
      let commPkr = 0;
      if (commSettings.mode === 'percentage') {
        commPkr = Math.round(grossPkr * (commSettings.rate / 100));
      } else if (commSettings.mode === 'fixed') {
        commPkr = commSettings.fixedFee;
      } else if (commSettings.mode === 'hybrid') {
        commPkr = Math.round(grossPkr * (commSettings.rate / 100)) + commSettings.fixedFee;
      }
      const payoutPkr = grossPkr - commPkr;

      const newPayment = this.paymentRepository.create({
        bookingId: booking.id,
        studentId: booking.studentId,
        ownerId: booking.ownerId,
        hostelId: booking.hostelId,
        amountPkr: grossPkr,
        commissionRate: commSettings.rate,
        commissionPkr: commPkr,
        payoutPkr: payoutPkr,
        paymentReference: `PHYSICAL-${booking.id.substring(0, 8).toUpperCase()}`,
        status: PaymentStatus.PAID,
        paidAt: new Date(),
      });
      const savedPayment = await this.paymentRepository.save(newPayment);

      // Store in payouts ledger
      await this.bookingRepository.query(`
        INSERT INTO payouts (payment_id, owner_id, amount_pkr, status)
        VALUES ($1, $2, $3, 'queued')
        ON CONFLICT (payment_id) DO UPDATE SET amount_pkr = EXCLUDED.amount_pkr
      `, [savedPayment.id, booking.ownerId, payoutPkr]).catch(e => {
        this.logger.error(`Failed to record payout ledger: ${e.message}`);
      });

    } else {
      const commSettings = await this.getCommissionSettings();
      const grossPkr = booking.totalFirstMonth || booking.monthlyPrice || 0;

      let commPkr = 0;
      if (commSettings.mode === 'percentage') {
        commPkr = Math.round(grossPkr * (commSettings.rate / 100));
      } else if (commSettings.mode === 'fixed') {
        commPkr = commSettings.fixedFee;
      } else if (commSettings.mode === 'hybrid') {
        commPkr = Math.round(grossPkr * (commSettings.rate / 100)) + commSettings.fixedFee;
      }
      const payoutPkr = grossPkr - commPkr;

      existingPayment.amountPkr = grossPkr;
      existingPayment.commissionRate = commSettings.rate;
      existingPayment.commissionPkr = commPkr;
      existingPayment.payoutPkr = payoutPkr;
      existingPayment.status = PaymentStatus.PAID;
      existingPayment.paidAt = new Date();
      if (!existingPayment.paymentReference) {
        existingPayment.paymentReference = `PHYSICAL-${booking.id.substring(0, 8).toUpperCase()}`;
      }
      await this.paymentRepository.save(existingPayment);

      // Store in payouts ledger
      await this.bookingRepository.query(`
        INSERT INTO payouts (payment_id, owner_id, amount_pkr, status)
        VALUES ($1, $2, $3, 'queued')
        ON CONFLICT (payment_id) DO UPDATE SET amount_pkr = EXCLUDED.amount_pkr
      `, [existingPayment.id, booking.ownerId, payoutPkr]).catch(e => {
        this.logger.error(`Failed to record payout ledger: ${e.message}`);
      });
    }

    // Auto-cancel other PENDING requests if the room is now full
    if (booking.room && booking.room.availableBeds === 0) {
      const otherPendings = await this.bookingRepository.find({
        where: {
          roomId: booking.roomId,
          status: BookingStatus.PENDING
        }
      });
      for (const other of otherPendings) {
        if (other.id !== booking.id) {
          other.status = BookingStatus.CANCELLED;
          other.cancellationReason = 'Room is now fully booked by another student';
          await this.bookingRepository.save(other);
        }
      }
    }

    return savedBooking;
  }

  async completeStay(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    
    if (booking.status !== BookingStatus.ACTIVE_STAY && booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only active or confirmed bookings can be completed');
    }

    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.COMPLETED);

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();

    return this.bookingRepository.save(booking);
  }

  async cancelBooking(id: string, studentId: string, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.studentId !== studentId) throw new ForbiddenException('Access denied');

    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.CANCELLED);

    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason ?? null;

    return this.bookingRepository.save(booking);
  }

  async remove(id: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    const oldStatus = booking.status;
    await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.CANCELLED);

    const cleanupQueries = [
        { q: `DELETE FROM payouts WHERE payment_id IN (SELECT id FROM payments WHERE booking_id = $1)`, t: 'payouts' },
        { q: `DELETE FROM refunds WHERE booking_id = $1`, t: 'refunds' },
        { q: `DELETE FROM payment_gateway_logs WHERE booking_id = $1`, t: 'payment_gateway_logs' },
        { q: `UPDATE payment_gateway_logs SET booking_id = NULL WHERE booking_id = $1`, t: 'payment_gateway_logs set null' },
        { q: `DELETE FROM payments WHERE booking_id = $1`, t: 'payments' },
        { q: `DELETE FROM reviews WHERE booking_id = $1`, t: 'reviews' },
        { q: `DELETE FROM active_stays WHERE booking_id = $1`, t: 'active_stays' },
        { q: `DELETE FROM complaints WHERE booking_id = $1`, t: 'complaints' },
        { q: `UPDATE complaints SET booking_id = NULL WHERE booking_id = $1`, t: 'complaints set null' },
        { q: `DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id = $1)`, t: 'messages' },
        { q: `DELETE FROM conversations WHERE booking_id = $1`, t: 'conversations' },
        { q: `UPDATE conversations SET booking_id = NULL WHERE booking_id = $1`, t: 'conversations set null' },
        { q: `DELETE FROM email_logs WHERE reference_id = $1`, t: 'email_logs' },
        { q: `DELETE FROM audit_logs WHERE entity_id = $1`, t: 'audit_logs' },
        { q: `DELETE FROM notifications WHERE reference_id = $1`, t: 'notifications' },
        { q: `DELETE FROM admin_notes WHERE entity_id = $1`, t: 'admin_notes' }
    ];

    for (const query of cleanupQueries) {
        try {
            await this.bookingRepository.query(query.q, [id]);
        } catch (err) {
            this.logger.warn(`Cleanup skipped for ${query.t}: ${err.message}`);
        }
    }
    
    try {
        await this.bookingRepository.query(`DELETE FROM bookings WHERE id = $1`, [id]);
        this.logger.log(`Successfully deleted booking ${id} and all its dependencies.`);
    } catch (err) {
        this.logger.error(`CRITICAL: FINAL DELETE FAILED for booking ${id}: ${err.message}`);
        throw err;
    }
  }

  async adminUpdate(id: string, updateDto: any): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    // Handle status change impacts on room availability using the unified helper
    if (updateDto.status && updateDto.status !== booking.status) {
      const oldStatus = booking.status;
      const newStatus = updateDto.status as BookingStatus;
      await this.handleBedAllocation(booking.roomId, oldStatus, newStatus);
    }
    
    Object.assign(booking, updateDto);
    return this.bookingRepository.save(booking);
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredBookings() {
    this.logger.log('Checking for expired bookings...');
    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: In([BookingStatus.APPROVED, BookingStatus.AWAITING_PAYMENT]),
        paymentDeadline: LessThan(new Date())
      }
    });

    if (expiredBookings.length > 0) {
      this.logger.log(`Expiring ${expiredBookings.length} bookings`);
      for (const booking of expiredBookings) {
        const oldStatus = booking.status;
        await this.handleBedAllocation(booking.roomId, oldStatus, BookingStatus.EXPIRED);

        booking.status = BookingStatus.EXPIRED;
        booking.cancellationReason = 'Payment deadline (24 hours) exceeded.';
        await this.bookingRepository.save(booking);
      }
    }
  }
}
