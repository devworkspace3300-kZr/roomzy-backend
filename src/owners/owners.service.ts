import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OwnerProfile } from './entities/owner-profile.entity';
import { OwnerVerificationRequest } from './entities/owner-verification-request.entity';
import { UpdateOwnerProfileDto } from './dto/update-owner-profile.dto';

@Injectable()
export class OwnersService {
  constructor(
    @InjectRepository(OwnerProfile)
    private readonly profileRepo: Repository<OwnerProfile>,
    @InjectRepository(OwnerVerificationRequest)
    private readonly verificationRepo: Repository<OwnerVerificationRequest>,
  ) {}

  async getProfile(userId: string) {
    let profile = await this.profileRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateOwnerProfileDto) {
    let profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepo.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }
    await this.profileRepo.save(profile);
    return profile;
  }

  async submitVerificationDocuments(userId: string, data: any) {
    const request = this.verificationRepo.create({
      userId,
      cnicFrontUrl: data.cnicFrontUrl,
      cnicBackUrl: data.cnicBackUrl,
      propertyOwnershipUrl: data.propertyOwnershipUrl,
      utilityBillUrl: data.utilityBillUrl,
      status: 'pending',
    });

    await this.verificationRepo.save(request);

    // Update owner profile status to 'under_review' per doc flow
    await this.profileRepo.update({ userId }, { verificationStatus: 'under_review' });

    return {
      message: 'Verification documents submitted successfully and are now under review.',
      requestId: request.id
    };
  }
}
