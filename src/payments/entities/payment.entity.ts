import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';
import { Hostel } from '../../hostels/entities/hostel.entity';

import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'booking_id' })
  bookingId: string;

  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'hostel_id' })
  hostelId: string;

  @ManyToOne(() => Hostel)
  @JoinColumn({ name: 'hostel_id' })
  hostel: Hostel;

  @Column({ type: 'integer', name: 'amount_pkr' })
  amountPkr: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'commission_rate', default: 10.00 })
  commissionRate: number;

  @Column({ type: 'integer', name: 'commission_pkr', default: 0 })
  commissionPkr: number;

  @Column({ type: 'integer', name: 'payout_pkr' })
  payoutPkr: number;

  @Column({ name: 'payment_reference', nullable: true })
  paymentReference: string;

  @Column({ type: 'jsonb', name: 'gateway_response', nullable: true })
  gatewayResponse: any;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'is_test', default: false })
  isTest: boolean;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
