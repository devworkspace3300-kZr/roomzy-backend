import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './entities/student-profile.entity';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly profileRepo: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string) {
    let profile = await this.profileRepo.findOne({ where: { userId }, relations: ['user'] });
    if (!profile) {
      profile = this.profileRepo.create({ userId });
      await this.profileRepo.save(profile);
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateStudentProfileDto) {
    await this.profileRepo.update({ userId }, dto);
    return this.getProfile(userId);
  }

  async toggleFavorite(userId: string, hostelId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedHostels']
    });
    
    if (!user) throw new NotFoundException('User not found');
    if (!user.savedHostels) user.savedHostels = [];
    
    const index = user.savedHostels.findIndex(h => h.id === hostelId);
    if (index > -1) {
      user.savedHostels.splice(index, 1);
    } else {
      user.savedHostels.push({ id: hostelId } as any);
    }
    
    return this.userRepo.save(user);
  }

  async getFavorites(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['savedHostels', 'savedHostels.images']
    });
    if (!user) return [];
    return user.savedHostels || [];
  }
}
