import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { RoomImage } from './entities/room-image.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { Hostel } from '../hostels/entities/hostel.entity';
import { HostelStatus } from '../common/enums/hostel-status.enum';
import { RoomAvailabilityStatus } from '../common/enums/room-availability-status.enum';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(RoomImage)
    private readonly imageRepository: Repository<RoomImage>,
    @InjectRepository(Hostel)
    private readonly hostelRepository: Repository<Hostel>,
  ) {}

  async create(ownerId: string, dto: CreateRoomDto): Promise<Room> {
    const hostel = await this.hostelRepository.findOne({ where: { id: dto.hostelId } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    if (hostel.ownerId !== ownerId) throw new ForbiddenException('You do not own this hostel');
    
    // RULE: Prevent room creation until hostel is verified
    if (hostel.status !== HostelStatus.VERIFIED) {
      throw new BadRequestException('You cannot add rooms until the admin verifies your hostel listing');
    }

    const { images: imageUrls, ...roomData } = dto;
    
    const room = this.roomRepository.create({
      ...roomData,
      availableBeds: dto.totalBeds,
      availabilityStatus: RoomAvailabilityStatus.AVAILABLE
    });

    const savedRoom = await this.roomRepository.save(room);

    // Handle Images
    if (imageUrls && imageUrls.length > 0) {
      if (imageUrls.length < 2) {
        throw new BadRequestException('Minimum 2 images required for room listing');
      }
      const imageEntities = imageUrls.map((url, index) => {
        return this.imageRepository.create({
          roomId: savedRoom.id,
          imageUrl: url,
          displayOrder: index
        });
      });
      await this.imageRepository.save(imageEntities);
    }

    return this.findOne(savedRoom.id);
  }

  async findByHostel(hostelId: string): Promise<Room[]> {
    return this.roomRepository.find({
      where: { hostelId, isActive: true },
      relations: ['images'],
      order: { pricePerMonth: 'ASC' }
    });
  }

  async findAllByHostel(hostelId: string): Promise<Room[]> {
    return this.roomRepository.find({
      where: { hostelId },
      relations: ['images'],
      order: { createdAt: 'ASC' }
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['images', 'hostel']
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async update(id: string, ownerId: string, data: Partial<CreateRoomDto>): Promise<Room> {
    const room = await this.findOne(id);
    if (room.hostel.ownerId !== ownerId) throw new ForbiddenException('Access denied');

    const { images: imageUrls, ...updateData } = data;

    // Update basic fields
    Object.assign(room, updateData);
    
    // Logic for availability status
    if (room.availableBeds === 0) {
      room.availabilityStatus = RoomAvailabilityStatus.FULL;
    } else if (room.availableBeds > 0 && room.availabilityStatus === RoomAvailabilityStatus.FULL) {
      room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
    }

    // Save basic room data
    const updatedRoom = await this.roomRepository.save(room);

    // Handle Images update if provided
    if (imageUrls !== undefined) {
      if (imageUrls.length < 2) {
        throw new BadRequestException('Minimum 2 images required for room listing');
      }

      // 1. Delete old images
      await this.imageRepository.delete({ roomId: id });

      // 2. Insert new ones
      const imageEntities = imageUrls.map((url, index) => {
        return this.imageRepository.create({
          roomId: id,
          imageUrl: url,
          displayOrder: index
        });
      });
      await this.imageRepository.save(imageEntities);
    }

    return this.findOne(id);
  }

  async adjustAvailability(roomId: string, bedsChange: number): Promise<void> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) return;

    room.availableBeds += bedsChange;
    
    if (room.availableBeds <= 0) {
      room.availableBeds = 0;
      room.availabilityStatus = RoomAvailabilityStatus.FULL;
    } else {
      room.availabilityStatus = RoomAvailabilityStatus.AVAILABLE;
    }

    await this.roomRepository.save(room);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const room = await this.findOne(id);
    if (room.hostel.ownerId !== ownerId) throw new ForbiddenException('Access denied');
    await this.roomRepository.remove(room);
  }
}
