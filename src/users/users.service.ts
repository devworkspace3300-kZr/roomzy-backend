import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ── GET ALL ──────────────────────────────────────────────────────
  async findAll(): Promise<Partial<User>[]> {
    return this.userRepository.find({
      select: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'city', 'profileImageUrl', 'createdAt', 'lastLoginAt'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── GET ONE ──────────────────────────────────────────────────────
  async findOne(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'fullName', 'email', 'phone', 'role', 'status', 'city', 'profileImageUrl', 'createdAt', 'lastLoginAt'],
    });
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    return user;
  }

  // ── UPDATE ───────────────────────────────────────────────────────
  async update(id: string, dto: UpdateUserDto): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    
    // Convert status toggle if needed
    if (dto['isActive'] !== undefined) {
      dto.status = dto['isActive'] ? 'active' : 'suspended';
      delete dto['isActive'];
    }

    Object.assign(user, dto);
    await this.userRepository.save(user);
    return this.findOne(id);
  }

  // ── DELETE ───────────────────────────────────────────────────────
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User with id "${id}" not found`);
    await this.userRepository.remove(user);
    return { message: `User "${user.fullName}" has been deleted successfully` };
  }

  async adminCreateUser(dto: any) {
    const { fullName, email, phone, role, password } = dto;
    
    // 1. Check if email exists
    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) throw new Error('Email already exists');

    // 2. Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const queryRunner = this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, {
        fullName,
        email,
        phone,
        passwordHash,
        role,
        status: 'active',
        emailVerified: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Create profile
      if (role === 'owner') {
        const { OwnerProfile } = require('../owners/entities/owner-profile.entity');
        const profile = queryRunner.manager.create(OwnerProfile, {
          userId: savedUser.id,
          verificationStatus: 'pending',
          totalHostels: 0,
          totalRevenuePkr: 0
        });
        await queryRunner.manager.save(profile);
      } else if (role === 'student') {
        const { StudentProfile } = require('../students/entities/student-profile.entity');
        const profile = queryRunner.manager.create(StudentProfile, {
          userId: savedUser.id
        });
        await queryRunner.manager.save(profile);
      }

      await queryRunner.commitTransaction();
      return this.sanitizeUser(savedUser);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
