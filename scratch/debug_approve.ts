
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BookingsService } from '../src/bookings/bookings.service';
import { BookingStatus } from '../src/common/enums/booking-status.enum';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const bookingsService = app.get(BookingsService);
  
  const bookingId = '719b96e7-ff8e-421e-a939-d6f0197374e4';
  const ownerId = '983f5bc7-30e2-41cf-8cce-56a18da7dda6';
  
  try {
    console.log(`Attempting to approve booking: ${bookingId} by owner: ${ownerId}`);
    const result = await bookingsService.respondToBooking(bookingId, ownerId, BookingStatus.APPROVED);
    console.log('Successfully approved booking:', result);
  } catch (error) {
    console.error('FAILED to approve booking:');
    console.error(error);
  } finally {
    await app.close();
  }
}

bootstrap();
