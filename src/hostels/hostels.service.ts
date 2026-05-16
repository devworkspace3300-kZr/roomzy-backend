import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Hostel } from './entities/hostel.entity';
import { HostelImage } from './entities/hostel-image.entity';
import { Amenity } from './entities/amenity.entity';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { HostelStatus } from '../common/enums/hostel-status.enum';
import { GenderType } from '../common/enums/gender-type.enum';

@Injectable()
export class HostelsService {
  constructor(
    @InjectRepository(Hostel)
    private readonly hostelRepository: Repository<Hostel>,
    @InjectRepository(HostelImage)
    private readonly imageRepository: Repository<HostelImage>,
    @InjectRepository(Amenity)
    private readonly amenityRepository: Repository<Amenity>,
  ) {}

  async create(ownerId: string, dto: CreateHostelDto): Promise<Hostel> {
    const slug = this.slugify(dto.name, dto.city);
    
    const existing = await this.hostelRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('A hostel with this name already exists in this city');
    }

    if (!dto.isDraft) {
      this.validateFullSubmission(dto);
    }

    const hostel = this.hostelRepository.create();
    Object.assign(hostel, {
      ...dto,
      ownerId,
      slug,
      status: dto.isDraft ? HostelStatus.DRAFT : HostelStatus.SUBMITTED,
      submittedAt: dto.isDraft ? null : new Date()
    });

    if (dto.amenityIds && dto.amenityIds.length > 0) {
      const amenities = await this.amenityRepository.findBy({ id: In(dto.amenityIds) });
      hostel.amenities = amenities;
    }

    const savedHostel = await this.hostelRepository.save(hostel);

    if (dto.images && dto.images.length > 0) {
      const images = dto.images.map((url, index) => {
        return this.imageRepository.create({
          hostelId: savedHostel.id,
          imageUrl: url,
          displayOrder: index,
          isCover: url === dto.coverImage || (index === 0 && !dto.coverImage)
        });
      });
      await this.imageRepository.save(images);
    }

    return this.findOne(savedHostel.id);
  }

  private validateFullSubmission(dto: CreateHostelDto) {
    if (!dto.description || dto.description.length < 100) throw new BadRequestException('Description min 100 chars');
    if (!dto.city || !dto.area || !dto.fullAddress) throw new BadRequestException('Location info missing');
    if (dto.latitude === undefined || dto.longitude === undefined) throw new BadRequestException('Coordinates missing');
    if (!dto.images || dto.images.length < 4) throw new BadRequestException('Min 4 images required');
    if (dto.startingPrice === undefined) throw new BadRequestException('Starting price missing');
  }

  async findAll(query: { city?: string, genderType?: GenderType, minPrice?: number, maxPrice?: number, institute?: string }): Promise<Hostel[]> {
    const qb = this.hostelRepository.createQueryBuilder('hostel')
      .leftJoinAndSelect('hostel.owner', 'owner')
      .leftJoinAndSelect('hostel.images', 'images')
      .leftJoinAndSelect('hostel.amenities', 'amenities')
      .leftJoinAndSelect('hostel.rooms', 'rooms')
      .where('hostel.status = :status', { status: HostelStatus.VERIFIED });

    if (query.city) {
      qb.andWhere('hostel.city ILIKE :city', { city: `%${query.city}%` });
    }

    if (query.institute) {
      qb.andWhere('hostel.nearestInstituteId = :instId', { instId: query.institute });
    }

    if (query.genderType) {
      qb.andWhere('hostel.genderType = :genderType', { genderType: query.genderType });
    }

    if (query.minPrice) {
      qb.andWhere('hostel.startingPrice >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      qb.andWhere('hostel.startingPrice <= :maxPrice', { maxPrice: query.maxPrice });
    }

    return qb.orderBy('hostel.createdAt', 'DESC').getMany();
  }

  async findAllPending(): Promise<Hostel[]> {
    return this.hostelRepository.find({
      where: [
        { status: HostelStatus.SUBMITTED },
        { status: HostelStatus.INSPECTION_SCHEDULED },
        { status: HostelStatus.UNDER_REVIEW }
      ],
      relations: ['owner', 'owner.ownerProfile', 'images', 'amenities'],
      order: { createdAt: 'DESC' }
    });
  }

  async findAllHistory(): Promise<Hostel[]> {
    return this.hostelRepository.find({
      where: [
        { status: HostelStatus.VERIFIED },
        { status: HostelStatus.REJECTED },
        { status: HostelStatus.DISABLED }
      ],
      relations: ['owner', 'images'],
      order: { updatedAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Hostel> {
    const hostel = await this.hostelRepository
      .createQueryBuilder('hostel')
      .leftJoinAndSelect('hostel.owner', 'owner')
      .leftJoinAndSelect('hostel.images', 'images')
      .leftJoinAndSelect('hostel.amenities', 'amenities')
      .leftJoinAndSelect('hostel.rooms', 'rooms')
      .leftJoinAndSelect('rooms.images', 'roomImages')
      .where('CAST(hostel.id AS VARCHAR) = :id OR hostel.slug = :id', { id })
      .getOne();
    if (!hostel) throw new NotFoundException('Hostel not found');
    return hostel;
  }

  async findByOwner(ownerId: string): Promise<Hostel[]> {
    return this.hostelRepository.find({
      where: { ownerId },
      relations: ['images', 'amenities'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateStatus(id: string, status: HostelStatus, rejectedReason?: string): Promise<Hostel> {
    const hostel = await this.hostelRepository.findOne({ where: { id } });
    if (!hostel) throw new NotFoundException('Hostel not found');

    hostel.status = status;
    if (status === HostelStatus.VERIFIED) hostel.verifiedAt = new Date();
    if (status === HostelStatus.REJECTED && rejectedReason) hostel.rejectedReason = rejectedReason;

    return this.hostelRepository.save(hostel);
  }

  async findAllAdmin(): Promise<Hostel[]> {
    return this.hostelRepository.find({
      relations: ['owner', 'owner.ownerProfile', 'images'],
      order: { createdAt: 'DESC' }
    });
  }

  async remove(id: string): Promise<void> {
    const hostel = await this.hostelRepository.findOne({ where: { id } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    await this.hostelRepository.remove(hostel);
  }

  async adminUpdate(id: string, updateDto: any): Promise<Hostel> {
    const hostel = await this.hostelRepository.findOne({ where: { id } });
    if (!hostel) throw new NotFoundException('Hostel not found');
    Object.assign(hostel, updateDto);
    return this.hostelRepository.save(hostel);
  }

  private slugify(name: string, city: string): string {
    const base = `${name}-${city}`.toLowerCase().trim();
    return base.replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-') + '-' + Math.random().toString(36).substring(2, 7);
  }
}
