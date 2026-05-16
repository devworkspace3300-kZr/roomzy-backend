import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('owner_verification_requests')
export class OwnerVerificationRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'cnic_front_url', length: 500 })
  cnicFrontUrl: string;

  @Column({ name: 'cnic_back_url', length: 500 })
  cnicBackUrl: string;

  @Column({ name: 'property_ownership_url', length: 500, nullable: true })
  propertyOwnershipUrl: string;

  @Column({ name: 'rental_agreement_url', length: 500, nullable: true })
  rentalAgreementUrl: string;

  @Column({ name: 'utility_bill_url', length: 500, nullable: true })
  utilityBillUrl: string;

  @Column({ name: 'noc_letter_url', length: 500, nullable: true })
  nocLetterUrl: string;

  @Column({ name: 'business_registration_url', length: 500, nullable: true })
  businessRegistrationUrl: string;

  @Column({ name: 'management_declaration_url', length: 500, nullable: true })
  managementDeclarationUrl: string;

  @Column({ name: 'additional_docs_urls', type: 'jsonb', nullable: true })
  additionalDocsUrls: string[];

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'under_review', 'additional_docs_required', 'verified', 'rejected', 'suspended'], 
    enumName: 'verif_status',
    default: 'pending' 
  })
  status: string;

  @Column({ name: 'reviewed_by', type: 'uuid', nullable: true })
  reviewedBy: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @Column({ name: 'inspection_scheduled_at', type: 'timestamp', nullable: true })
  inspectionScheduledAt: Date;

  @Column({ name: 'inspection_scheduled_by', type: 'uuid', nullable: true })
  inspectionScheduledBy: string;

  @Column({ name: 'inspection_conducted_at', type: 'timestamp', nullable: true })
  inspectionConductedAt: Date;

  @Column({ 
    name: 'inspection_outcome', 
    type: 'enum', 
    enum: ['passed', 'failed', 'conditional', 'rescheduled'], 
    enumName: 'inspection_outcome',
    nullable: true 
  })
  inspectionOutcome: string;

  @Column({ name: 'inspection_notes', type: 'text', nullable: true })
  inspectionNotes: string;

  @Column({ name: 'inspection_photo_urls', type: 'jsonb', nullable: true })
  inspectionPhotoUrls: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
