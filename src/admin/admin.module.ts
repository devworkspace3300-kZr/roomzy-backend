import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { OwnerProfile } from '../owners/entities/owner-profile.entity';
import { OwnerVerificationRequest } from '../owners/entities/owner-verification-request.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OwnerProfile, OwnerVerificationRequest]),
    AuthModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
