import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn, BeforeInsert, BeforeUpdate
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('owner_profiles')
export class OwnerProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  cnic: string | null;

  @Column({ type: 'varchar', name: 'business_name', length: 200, nullable: true })
  businessName: string | null;

  @Column({ type: 'varchar', name: 'business_type', length: 100, nullable: true })
  businessType: string | null;

  @Column({ name: 'about_owner', type: 'text', nullable: true })
  aboutOwner: string | null;

  @Column({ 
    name: 'verification_status', 
    type: 'enum', 
    enum: ['pending', 'under_review', 'additional_docs_required', 'verified', 'rejected', 'suspended'], 
    enumName: 'verif_status',
    default: 'pending' 
  })
  verificationStatus: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ name: 'suspension_reason', type: 'text', nullable: true })
  suspensionReason: string;

  @Column({ name: 'suspended_at', type: 'timestamp', nullable: true })
  suspendedAt: Date;

  @Column({ name: 'resubmission_count', default: 0 })
  resubmissionCount: number;

  @Column({ name: 'total_hostels', default: 0 })
  totalHostels: number;

  @Column({ name: 'total_rooms', default: 0 })
  totalRooms: number;

  @Column({ name: 'total_bookings', default: 0 })
  totalBookings: number;

  @Column({ name: 'total_revenue_pkr', type: 'bigint', default: 0 })
  totalRevenuePkr: number;

  @Column({ name: 'total_commission_paid_pkr', type: 'bigint', default: 0 })
  totalCommissionPaidPkr: number;

  @Column({ name: 'complaint_count', default: 0 })
  complaintCount: number;

  @Column({ name: 'penalty_score', default: 0 })
  penaltyScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  normalizeData() {
    if (this.cnic === '') this.cnic = null;
    if (this.businessName === '') this.businessName = null;
    if (this.businessType === '') this.businessType = null;
    if (this.aboutOwner === '') this.aboutOwner = null;
  }
}
