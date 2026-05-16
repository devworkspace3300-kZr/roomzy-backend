import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './entities/booking.entity';
import { Room } from '../rooms/entities/room.entity';
import { Hostel } from '../hostels/entities/hostel.entity';
import { AuthModule } from '../auth/auth.module';
import { BookingsScheduler } from './bookings.scheduler';
import { Payment } from '../payments/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Room, Hostel, Payment]),
    AuthModule,
  ],
  controllers: [BookingsController],
  providers: [BookingsService, BookingsScheduler],
  exports: [BookingsService],
})
export class BookingsModule {}
