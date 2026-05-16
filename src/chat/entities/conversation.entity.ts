import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Hostel } from '../../hostels/entities/hostel.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { ConversationStatus } from '../../common/enums/conversation-status.enum';
import { Message } from './message.entity';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({ type: 'uuid', name: 'owner_id', nullable: true })
  ownerId: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ type: 'uuid', name: 'booking_id', nullable: true })
  bookingId: string | null;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column({ type: 'uuid', name: 'hostel_id', nullable: true })
  hostelId: string | null;

  @ManyToOne(() => Hostel)
  @JoinColumn({ name: 'hostel_id' })
  hostel: Hostel;

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.PRE_BOOKING })
  status: ConversationStatus;

  @Column({ name: 'last_message_at', type: 'timestamp', nullable: true })
  lastMessageAt: Date;

  @Column({ name: 'last_message_preview', length: 300, nullable: true })
  lastMessagePreview: string;

  @OneToMany(() => Message, (message) => message.conversation)
  messages: Message[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
