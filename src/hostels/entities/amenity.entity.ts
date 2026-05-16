import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn
} from 'typeorm';

@Entity('amenities')
export class Amenity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ length: 100, unique: true })
  slug: string;

  @Column({ name: 'icon_key', length: 100, nullable: true })
  iconKey: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
