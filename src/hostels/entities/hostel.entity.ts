import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
  ManyToMany, JoinTable
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { HostelStatus } from '../../common/enums/hostel-status.enum';
import { GenderType } from '../../common/enums/gender-type.enum';
import { HostelImage } from './hostel-image.entity';
import { Amenity } from './amenity.entity';

import { Room } from '../../rooms/entities/room.entity';

@Entity('hostels')
export class Hostel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToMany(() => HostelImage, (image) => image.hostel, { cascade: true })
  images: HostelImage[];

  @OneToMany(() => Room, (room) => room.hostel)
  rooms: Room[];

  @ManyToMany(() => Amenity)
  @JoinTable({
    name: 'hostel_amenities',
    joinColumn: { name: 'hostel_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'amenity_id', referencedColumnName: 'id' }
  })
  amenities: Amenity[];

  @Column({ name: 'owner_id' })
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ length: 200 })
  name: string;

  @Column({ unique: true, length: 250 })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ length: 100 })
  city: string;

  @Column({ name: 'city_id', type: 'uuid', nullable: true })
  cityId: string;

  @Column({ length: 150 })
  area: string;

  @Column({ name: 'full_address', type: 'text' })
  fullAddress: string;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 9, scale: 6, nullable: true })
  longitude: number;

  @Column({ name: 'google_maps_url', length: 500, nullable: true })
  googleMapsUrl: string;

  @Column({ type: 'enum', enum: GenderType, name: 'gender_type' })
  genderType: GenderType;

  @Column({ name: 'total_floors', nullable: true })
  totalFloors: number;

  @Column({ name: 'total_rooms_count', default: 0 })
  totalRoomsCount: number;

  @Column({ name: 'nearest_institute_id', type: 'uuid', nullable: true })
  nearestInstituteId: string;

  @Column({ name: 'institute_distance_km', type: 'decimal', precision: 5, scale: 2, nullable: true })
  instituteDistanceKm: number;

  @Column({ name: 'starting_price', nullable: true })
  startingPrice: number;

  @Column({ name: 'video_url', length: 500, nullable: true })
  videoUrl: string;

  @Column({ type: 'enum', enum: HostelStatus, default: HostelStatus.DRAFT })
  status: HostelStatus;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date | null;

  @Column({ name: 'inspection_scheduled_at', type: 'timestamp', nullable: true })
  inspectionScheduledAt: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy: string;

  @Column({ name: 'rejected_reason', type: 'text', nullable: true })
  rejectedReason: string;

  @Column({ name: 'disabled_reason', type: 'text', nullable: true })
  disabledReason: string;

  @Column({ name: 'online_docs_submitted', default: false })
  onlineDocsSubmitted: boolean;

  @Column({ name: 'online_verified', default: false })
  onlineVerified: boolean;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0.00 })
  averageRating: number;

  @Column({ name: 'total_reviews', default: 0 })
  totalReviews: number;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ name: 'featured_until', type: 'timestamp', nullable: true })
  featuredUntil: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  badges: string[];

  @Column({ name: 'meta_title', length: 200, nullable: true })
  metaTitle: string;

  @Column({ name: 'meta_description', type: 'text', nullable: true })
  metaDescription: string;

  @ManyToMany(() => User, (user) => user.savedHostels)
  savedBy: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
