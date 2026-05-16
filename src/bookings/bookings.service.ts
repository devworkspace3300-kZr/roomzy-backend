import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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

@Injectable()
export class BookingsService {
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

  async findMyBookings(studentId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { studentId },
      relations: ['hostel', 'room', 'hostel.images'],
      order: { createdAt: 'DESC' }
    });
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
    
    return this.bookingRepository.save(booking);
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

  async confirmBooking(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    
    if (booking.status !== BookingStatus.APPROVED && booking.status !== BookingStatus.AWAITING_PAYMENT) {
      // Allow confirmation if already confirmed (idempotency)
      if (booking.status === BookingStatus.CONFIRMED) return booking;
      throw new BadRequestException('Booking must be approved before confirmation');
    }

    // ALLOCATE BED ON PAYMENT
    const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
    if (!room || room.availableBeds <= 0) {
      throw new BadRequestException('All beds in this room have been taken by other students who completed their payment first.');
    }

    room.availableBeds -= 1;
    if (room.availableBeds <= 0) {
      room.availabilityStatus = RoomAvailabilityStatus.FULL;
    }
    await this.roomRepository.save(room);

    booking.status = BookingStatus.CONFIRMED;
    booking.confirmedAt = new Date();
    const savedBooking = await this.bookingRepository.save(booking);

    // Auto-cancel other PENDING requests if the room is now full
    if (room.availableBeds === 0) {
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

    booking.status = BookingStatus.COMPLETED;
    booking.completedAt = new Date();
    
    // FREE UP BED
    const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
    if (room) {
      room.availableBeds += 1;
      room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
      await this.roomRepository.save(room);
    }

    return this.bookingRepository.save(booking);
  }

  async cancelBooking(id: string, studentId: string, reason?: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id }, relations: ['room'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.studentId !== studentId) throw new ForbiddenException('Access denied');

    const oldStatus = booking.status;
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason ?? null;

    if (oldStatus === BookingStatus.CONFIRMED || oldStatus === BookingStatus.ACTIVE_STAY) {
      const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
      if (room) {
        room.availableBeds += 1;
        room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
        await this.roomRepository.save(room);
      }
    }

    return this.bookingRepository.save(booking);
  }

  async remove(id: string): Promise<void> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    // RESTORE BED COUNT IF PAID/ACTIVE
    if ([BookingStatus.CONFIRMED, BookingStatus.ACTIVE_STAY].includes(booking.status)) {
      const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
      // SAFETY: Only increment if we won't exceed total_beds
      if (room && room.availableBeds < room.totalBeds) {
        room.availableBeds += 1;
        room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
        await this.roomRepository.save(room);
      }
    }

    // AGGRESSIVE CLEANUP: Use raw SQL to clear all potential database-level dependencies
    const em = this.bookingRepository.manager;
    
    const cleanupQueries = [
        { q: `DELETE FROM payouts WHERE payment_id IN (SELECT id FROM payments WHERE booking_id = $1)`, t: 'payouts' },
        { q: `DELETE FROM refunds WHERE booking_id = $1`, t: 'refunds' },
        { q: `DELETE FROM payment_gateway_logs WHERE booking_id = $1`, t: 'payment_gateway_logs' },
        { q: `DELETE FROM payments WHERE booking_id = $1`, t: 'payments' },
        { q: `DELETE FROM review_category_ratings WHERE review_id IN (SELECT id FROM reviews WHERE booking_id = $1)`, t: 'review_category_ratings' },
        { q: `DELETE FROM reviews WHERE booking_id = $1`, t: 'reviews' },
        { q: `DELETE FROM active_stays WHERE booking_id = $1`, t: 'active_stays' },
        { q: `DELETE FROM complaint_escalations WHERE complaint_id IN (SELECT id FROM complaints WHERE booking_id = $1)`, t: 'complaint_escalations' },
        { q: `DELETE FROM complaints WHERE booking_id = $1`, t: 'complaints' },
        { q: `DELETE FROM conversations WHERE booking_id = $1`, t: 'conversations' },
        { q: `DELETE FROM email_logs WHERE reference_id = $1 AND reference_type = 'booking'`, t: 'email_logs' },
        { q: `DELETE FROM audit_logs WHERE entity_id = $1 AND entity_type = 'booking'`, t: 'audit_logs' },
        { q: `DELETE FROM notifications WHERE reference_id = $1 AND reference_type = 'booking'`, t: 'notifications' },
        { q: `DELETE FROM admin_notes WHERE entity_id = $1 AND entity_type = 'booking'`, t: 'admin_notes' }
    ];

    for (const query of cleanupQueries) {
        try {
            await em.query(query.q, [id]);
        } catch (err) {
            this.logger.warn(`Cleanup skipped for ${query.t}: ${err.message}`);
        }
    }
    
    // Final nuclear option: delete the booking itself via raw SQL
    try {
        await em.query(`DELETE FROM bookings WHERE id = $1`, [id]);
        this.logger.log(`Successfully deleted booking ${id} and all its dependencies.`);
    } catch (err) {
        this.logger.error(`CRITICAL: FINAL DELETE FAILED for booking ${id}: ${err.message}`);
        throw err;
    }
  }

  async adminUpdate(id: string, updateDto: any): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    
    // Handle status change impacts on room availability
    if (updateDto.status && updateDto.status !== booking.status) {
        const oldStatus = booking.status;
        const newStatus = updateDto.status;
        
        const isCurrentlyOccupying = [BookingStatus.APPROVED, BookingStatus.CONFIRMED, BookingStatus.ACTIVE_STAY].includes(oldStatus);
        const willBeOccupying = [BookingStatus.APPROVED, BookingStatus.CONFIRMED, BookingStatus.ACTIVE_STAY].includes(newStatus);
        
        if (!isCurrentlyOccupying && willBeOccupying) {
            // Decrement
            const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
            if (room) {
                room.availableBeds -= 1;
                if (room.availableBeds <= 0) {
                    room.availableBeds = 0;
                    room.availabilityStatus = RoomAvailabilityStatus.FULL;
                }
                await this.roomRepository.save(room);
            }
        } else if (isCurrentlyOccupying && !willBeOccupying) {
            // Increment
            const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
            if (room) {
                room.availableBeds += 1;
                room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
                await this.roomRepository.save(room);
            }
        }
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
        // Restore bed count since it was reserved on approval
        const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
        if (room) {
          room.availableBeds += 1;
          room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
          await this.roomRepository.save(room);
        }

        booking.status = BookingStatus.EXPIRED;
        booking.cancellationReason = 'Payment deadline (24 hours) exceeded.';
        await this.bookingRepository.save(booking);
      }
    }
  }
}
