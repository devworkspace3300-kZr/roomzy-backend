import {
  Injectable, ConflictException, UnauthorizedException,
  ForbiddenException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService }       from '@nestjs/jwt';
import { ConfigService }    from '@nestjs/config';
import * as bcrypt          from 'bcrypt';
 
import { User }            from '../users/entities/user.entity';
import { OwnerProfile }    from '../owners/entities/owner-profile.entity';
import { StudentProfile }  from '../students/entities/student-profile.entity';
import { RegisterDto }     from './dto/register.dto';
import { LoginDto }        from './dto/login.dto';
import { UserRole }        from '../common/enums/user-role.enum';
 
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo:   Repository<User>,
    private jwtService:  JwtService,
    private config:      ConfigService,
    private dataSource:  DataSource,
  ) {}
 
  // ─── REGISTER ─────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // 1. Check if email already taken
    const existing = await this.usersRepo.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }
 
    // 2. Hash the password
    const saltRounds  = parseInt(this.config.get('BCRYPT_SALT_ROUNDS') || '12');
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);
 
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Create user record
      const user = queryRunner.manager.create(User, {
        fullName:     dto.fullName,
        email:        dto.email,
        phone:        dto.phone,
        passwordHash: passwordHash,
        role:         dto.role,
        city:         dto.city,
        status:       'active',
        emailVerified: false,
      });
      await queryRunner.manager.save(user);

      // 4. Create Role-Specific Profile
      if (dto.role === UserRole.OWNER) {
        const ownerProfile = queryRunner.manager.create(OwnerProfile, {
          userId: user.id,
          cnic: dto.cnic || null,
          businessName: dto.businessName || null,
          verificationStatus: 'pending',
          totalHostels: 0,
          totalRevenuePkr: 0,
        });
        await queryRunner.manager.save(ownerProfile);
      } else if (dto.role === UserRole.STUDENT) {
        const studentProfile = queryRunner.manager.create(StudentProfile, {
          userId: user.id,
          gender: dto.gender,
          instituteId: dto.instituteId,
        });
        await queryRunner.manager.save(studentProfile);
      }

      await queryRunner.commitTransaction();

      // 5. Sign JWT token (new owners are pending by default)
      const token = this.signToken(
        user.id, 
        user.email, 
        user.role, 
        dto.role === UserRole.OWNER ? 'pending' : undefined
      );
   
      return {
        token,
        user: this.sanitizeUser(user),
        message: 'Registration successful',
      };
    } catch (error) {
      console.error('REGISTRATION ERROR:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
 
  // ─── LOGIN ────────────────────────────────────────────────
  async login(dto: LoginDto) {
    try {
      const user = await this.usersRepo.findOne({ where: { email: dto.email } });
  
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Check lockout status
      if (user.lockoutUntil && user.lockoutUntil > new Date()) {
        throw new ForbiddenException(`Account is temporarily locked due to multiple failed login attempts. Try again later.`);
      } else if (user.lockoutUntil && user.lockoutUntil <= new Date()) {
        // Lockout expired, reset counter
        user.loginAttemptCount = 0;
        user.lockoutUntil = null;
        await this.usersRepo.save(user);
      }
  
      const passwordMatch = await bcrypt.compare(dto.password, user.passwordHash);
      if (!passwordMatch) {
        user.loginAttemptCount += 1;
        if (user.loginAttemptCount >= 5) {
          user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
        }
        await this.usersRepo.save(user);
        throw new UnauthorizedException('Invalid credentials');
      }
  
      if (user.status !== 'active') {
        throw new ForbiddenException('Your account has been deactivated. Please contact the administrator for support.');
      }
  
      // Reset login attempts on success
      user.loginAttemptCount = 0;
      user.lockoutUntil = null;
      user.lastLoginAt = new Date();
      await this.usersRepo.save(user);

      // Fetch verification status if owner
      let verificationStatus: string | undefined;
      if (user.role === UserRole.OWNER) {
        const profile = await this.dataSource.getRepository(OwnerProfile).findOne({ where: { userId: user.id } });
        verificationStatus = profile?.verificationStatus || 'pending';
      }

      const token = this.signToken(user.id, user.email, user.role, verificationStatus);
  
      return {
        token,
        user: this.sanitizeUser(user),
        message: 'Login successful',
      };
    } catch (error) {
      throw error;
    }
  }
 
  // ─── GET ME ───────────────────────────────────────────────
  async getMe(userId: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    
    const safeUser = this.sanitizeUser(user);
    
    // Attach profile info
    if (user.role === UserRole.OWNER) {
      const profile = await this.dataSource.getRepository(OwnerProfile).findOne({ where: { userId: user.id } });
      return { 
        ...safeUser, 
        profile,
        verificationStatus: profile?.verificationStatus || 'pending'
      };
    } else if (user.role === UserRole.STUDENT) {
      const profile = await this.dataSource.getRepository(StudentProfile).findOne({ where: { userId: user.id } });
      return { ...safeUser, profile };
    }
    
    return safeUser;
  }
 
  // ─── HELPERS ─────────────────────────────────────────────
  private signToken(userId: string, email: string, role: UserRole, verificationStatus?: string): string {
    const payload: any = {
      sub:   userId,
      email: email,
      role:  role,
    };
    if (verificationStatus) {
      payload.verification_status = verificationStatus;
    }
    return this.jwtService.sign(payload);
  }
 
  // Remove passwordHash before sending user data to frontend
  private sanitizeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
