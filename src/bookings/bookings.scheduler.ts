import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { BookingStatus } from '../common/enums/booking-status.enum';
import { RoomAvailabilityStatus } from '../common/enums/room-availability-status.enum';

@Injectable()
export class BookingsScheduler {
  private readonly logger = new Logger(BookingsScheduler.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handlePaymentDeadlines() {
    this.logger.debug('Checking for expired payment deadlines...');
    
    // Find bookings that were approved more than 24 hours ago
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const expiredBookings = await this.bookingRepository.find({
      where: {
        status: BookingStatus.APPROVED,
        approvedAt: LessThan(twentyFourHoursAgo)
      },
      relations: ['room']
    });

    for (const booking of expiredBookings) {
      this.logger.log(`Cancelling booking ${booking.id} due to payment timeout`);
      
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = 'Payment not received within 24 hours of approval';
      
      // Release the room bed
      const room = await this.roomRepository.findOne({ where: { id: booking.roomId } });
      if (room) {
        room.availableBeds += 1;
        room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
        await this.roomRepository.save(room);
      }
      
      await this.bookingRepository.save(booking);
    }
  }
}
