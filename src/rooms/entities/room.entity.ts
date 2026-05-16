import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn
} from 'typeorm';
import { Hostel } from '../../hostels/entities/hostel.entity';
import { RoomType } from '../../common/enums/room-type.enum';
import { RoomAvailabilityStatus } from '../../common/enums/room-availability-status.enum';
import { RoomImage } from './room-image.entity';

@Entity('rooms')
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hostel_id' })
  hostelId: string;

  @ManyToOne(() => Hostel, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hostel_id' })
  hostel: Hostel;

  @OneToMany(() => RoomImage, (image) => image.room)
  images: RoomImage[];

  @Column({ name: 'room_number', length: 30, nullable: true })
  roomNumber: string;

  @Column({ name: 'room_name', length: 100, nullable: true })
  roomName: string;

  @Column({ type: 'enum', enum: RoomType, name: 'room_type' })
  roomType: RoomType;

  @Column({ name: 'floor_number', nullable: true })
  floorNumber: number;

  @Column({ name: 'total_beds' })
  totalBeds: number;

  @Column({ name: 'available_beds' })
  availableBeds: number;

  @Column({ name: 'price_per_month' })
  pricePerMonth: number;

  @Column({ name: 'security_deposit', default: 0 })
  securityDeposit: number;

  @Column({ name: 'has_attached_bathroom', default: false })
  hasAttachedBathroom: boolean;

  @Column({ name: 'has_ac', default: false })
  hasAc: boolean;

  @Column({ 
    type: 'enum', 
    enum: RoomAvailabilityStatus, 
    name: 'availability_status',
    default: RoomAvailabilityStatus.AVAILABLE 
  })
  availabilityStatus: RoomAvailabilityStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
