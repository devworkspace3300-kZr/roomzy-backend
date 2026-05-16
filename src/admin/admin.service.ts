import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnerProfile } from '../owners/entities/owner-profile.entity';
import { OwnerVerificationRequest } from '../owners/entities/owner-verification-request.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(OwnerProfile)
    private readonly ownerProfileRepo: Repository<OwnerProfile>,
    @InjectRepository(OwnerVerificationRequest)
    private readonly verificationRepo: Repository<OwnerVerificationRequest>,
  ) {}

  async getDashboardStats() {
    const totalUsers = await this.ownerProfileRepo.count(); // Simplified for now
    return {
      message: 'Admin dashboard statistics',
      totalUsers: totalUsers,
      totalHostels: 0,
    };
  }

  async getPendingOwners() {
    return this.verificationRepo.find({
      where: [
        { status: 'pending' },
        { status: 'under_review' }
      ],
      relations: ['user']
    });
  }

  async verifyOwner(ownerId: string, adminId: string) {
    await this.ownerProfileRepo.update(
      { userId: ownerId },
      { 
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        verifiedBy: adminId
      }
    );

    await this.verificationRepo.update(
      { userId: ownerId, status: 'pending' },
      { 
        status: 'verified',
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    );

    return { message: 'Owner verified successfully' };
  }

  async rejectOwner(ownerId: string, adminId: string, reason: string) {
    await this.ownerProfileRepo.update(
      { userId: ownerId },
      { 
        verificationStatus: 'rejected',
        rejectionReason: reason
      }
    );

    await this.verificationRepo.update(
      { userId: ownerId, status: 'pending' },
      { 
        status: 'rejected',
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewedBy: adminId
      }
    );

    return { message: 'Owner verification rejected' };
  }

  async scheduleInspection(ownerId: string, adminId: string, scheduledAt: Date) {
    await this.verificationRepo.update(
      { userId: ownerId, status: 'pending' },
      { 
        status: 'under_review',
        inspectionScheduledAt: scheduledAt,
        inspectionScheduledBy: adminId
      }
    );

    return { message: 'Physical inspection scheduled' };
  }
}
