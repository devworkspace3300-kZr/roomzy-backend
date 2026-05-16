import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { databaseConfig } from './config/database.config';

// Import Entities to ensure metadata is loaded
import { User } from './users/entities/user.entity';
import { StudentProfile } from './students/entities/student-profile.entity';
import { OwnerProfile } from './owners/entities/owner-profile.entity';
import { OwnerVerificationRequest } from './owners/entities/owner-verification-request.entity';
import { Hostel } from './hostels/entities/hostel.entity';
import { HostelImage } from './hostels/entities/hostel-image.entity';
import { Amenity } from './hostels/entities/amenity.entity';
import { Room } from './rooms/entities/room.entity';
import { RoomImage } from './rooms/entities/room-image.entity';
import { Booking } from './bookings/entities/booking.entity';
import { Institute } from './institutes/entities/institute.entity';
import { Payment } from './payments/entities/payment.entity';
import { Conversation } from './chat/entities/conversation.entity';
import { Message } from './chat/entities/message.entity';

// Import Modules
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { StudentsModule } from './students/students.module';
import { OwnersModule } from './owners/owners.module';
import { AdminModule } from './admin/admin.module';
import { HostelsModule } from './hostels/hostels.module';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { InstitutesModule } from './institutes/institutes.module';
import { PaymentsModule } from './payments/payments.module';
import { ChatModule } from './chat/chat.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Global Rate Limiting: 100 requests per 60 seconds
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...databaseConfig(),
        entities: [
          User, StudentProfile, OwnerProfile, OwnerVerificationRequest,
          Hostel, HostelImage, Amenity, Room, RoomImage, 
          Booking, Institute, Payment, Conversation, Message
        ],
      }),
    }),
    ScheduleModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    UsersModule,
    AuthModule,
    StudentsModule,
    OwnersModule,
    AdminModule,
    HostelsModule,
    RoomsModule,
    BookingsModule,
    InstitutesModule,
    PaymentsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
