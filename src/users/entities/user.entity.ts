import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToMany, JoinTable,
  OneToOne,
} from 'typeorm';
import { UserRole }    from '../../common/enums/user-role.enum';
import { Hostel }      from '../../hostels/entities/hostel.entity';
 
@Entity('users')  // Tells TypeORM: this class maps to the 'users' table
export class User {
 
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  @Column({ name: 'full_name', length: 100 })
  fullName: string;
 
  @Column({ unique: true, length: 255 })
  email: string;
 
  @Column({ length: 20 })
  phone: string;
 
  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;
 
  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;
 
  @Column({ type: 'enum', enum: ['active', 'suspended', 'deleted', 'deactivated'], enumName: 'user_status', default: 'active' })
  status: string;
 
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;
 
  @Column({ name: 'profile_image_url', nullable: true, length: 500 })
  profileImageUrl: string;
 
  @Column({ nullable: true, length: 100 })
  city: string;
 
  @Column({ name: 'email_verify_token', type: 'varchar', length: 255, nullable: true })
  emailVerifyToken: string | null;

  @Column({ name: 'email_verify_expiry', type: 'timestamp', nullable: true })
  emailVerifyExpiry: Date | null;

  @Column({ name: 'password_reset_token', type: 'varchar', length: 255, nullable: true })
  passwordResetToken: string | null;

  @Column({ name: 'password_reset_expiry', type: 'timestamp', nullable: true })
  passwordResetExpiry: Date | null;

  @Column({ name: 'fcm_token', type: 'varchar', length: 500, nullable: true })
  fcmToken: string | null;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'last_login_ip', type: 'varchar', length: 50, nullable: true })
  lastLoginIp: string | null;

  @Column({ name: 'login_attempt_count', type: 'int', default: 0 })
  loginAttemptCount: number;

  @Column({ name: 'lockout_until', type: 'timestamp', nullable: true })
  lockoutUntil: Date | null;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToOne('OwnerProfile', 'user')
  ownerProfile: any;

  @OneToOne('StudentProfile', 'user')
  studentProfile: any;

  @ManyToMany(() => Hostel)
  @JoinTable({
    name: 'saved_hostels',
    joinColumn: { name: 'student_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'hostel_id', referencedColumnName: 'id' }
  })
  savedHostels: Hostel[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}