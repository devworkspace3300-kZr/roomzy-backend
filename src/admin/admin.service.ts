import { Injectable, BadRequestException } from '@nestjs/common';
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

  async getPendingOwners(status?: string) {
    let where: any = {};
    if (status && status !== 'all') {
      if (status === 'pending') {
        where = [
          { status: 'pending' },
          { status: 'under_review' }
        ];
      } else {
        where.status = status;
      }
    }
    return this.verificationRepo.find({
      where,
      relations: ['user'],
      order: { createdAt: 'DESC' }
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
      { userId: ownerId },
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
      { userId: ownerId },
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
      { userId: ownerId },
      { 
        status: 'under_review',
        inspectionScheduledAt: scheduledAt,
        inspectionScheduledBy: adminId
      }
    );

    return { message: 'Physical inspection scheduled' };
  }

  async getCommissionRate() {
    const res = await this.verificationRepo.query(`
      SELECT value FROM system_settings WHERE key = 'commission_settings'
    `);
    
    if (res.length > 0) {
      try {
        const settings = JSON.parse(res[0].value);
        return { success: true, ...settings };
      } catch (e) {
        // Fallback
      }
    }

    // Fallback to old format
    const oldRes = await this.verificationRepo.query(`
      SELECT value FROM system_settings WHERE key = 'commission_rate'
    `);
    const rate = oldRes.length > 0 ? parseFloat(oldRes[0].value) : 10.0;
    return { success: true, mode: 'percentage', rate, fixedFee: 0 };
  }

  async updateCommissionRate(rate: number, fixedFee: number = 0, mode: string = 'percentage') {
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      throw new BadRequestException('Commission rate must be a valid number between 0 and 100');
    }
    
    const settings = { mode, rate, fixedFee };

    await this.verificationRepo.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('commission_settings', $1, 'Platform commission settings json')
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
    `, [JSON.stringify(settings)]);

    return { success: true, message: 'Commission settings updated successfully', ...settings };
  }
}
