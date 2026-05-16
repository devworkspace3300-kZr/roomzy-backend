import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ length: 10, nullable: true })
  gender: string;

  @Column({ name: 'institute_id', type: 'uuid', nullable: true })
  instituteId: string;

  @Column({ name: 'institute_name', length: 200, nullable: true })
  instituteName: string;

  @Column({ length: 200, nullable: true })
  department: string;

  @Column({ length: 200, nullable: true })
  program: string;

  @Column({ name: 'student_id_number', length: 100, nullable: true })
  studentIdNumber: string;

  @Column({ name: 'student_id_doc_url', length: 500, nullable: true })
  studentIdDocUrl: string;

  @Column({ name: 'student_id_verified', default: false })
  studentIdVerified: boolean;

  @Column({ name: 'emergency_contact_name', length: 100, nullable: true })
  emergencyContactName: string;

  @Column({ name: 'emergency_contact_phone', length: 20, nullable: true })
  emergencyContactPhone: string;

  @Column({ type: 'jsonb', nullable: true })
  preferences: any;

  @Column({ name: 'total_bookings', default: 0 })
  totalBookings: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
