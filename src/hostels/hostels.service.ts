import { Injectable, ConflictException, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(HostelsService.name);

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

  async findAll(query: { 
    city?: string, 
    area?: string,
    genderType?: GenderType, 
    minPrice?: number, 
    maxPrice?: number, 
    institute?: string,
    roomType?: string,
    amenities?: string
  }): Promise<Hostel[]> {
    const qb = this.hostelRepository.createQueryBuilder('hostel')
      .leftJoinAndSelect('hostel.owner', 'owner')
      .leftJoinAndSelect('hostel.images', 'images')
      .leftJoinAndSelect('hostel.amenities', 'amenities')
      .leftJoinAndSelect('hostel.rooms', 'rooms')
      .where('hostel.status = :status', { status: HostelStatus.VERIFIED });

    if (query.city) {
      qb.andWhere('hostel.city ILIKE :city', { city: `%${query.city}%` });
    }

    if (query.area) {
      qb.andWhere('hostel.area ILIKE :area', { area: `%${query.area}%` });
    }

    if (query.institute) {
      qb.andWhere('(hostel.nearestInstituteId = :instId OR hostel.nearestInstituteId ILIKE :instPattern)', { 
        instId: query.institute,
        instPattern: `%${query.institute}%`
      });
    }

    if (query.genderType) {
      qb.andWhere('hostel.genderType = :genderType', { genderType: query.genderType });
    }

    if (query.roomType) {
      // Check if any room in the hostel matches the type
      qb.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('room.id')
          .from('rooms', 'room')
          .where('room.hostelId = hostel.id')
          .andWhere('room.roomType ILIKE :roomType', { roomType: `%${query.roomType}%` })
          .getQuery();
        return 'EXISTS ' + subQuery;
      });
    }

    if (query.amenities) {
      const amenityList = query.amenities.split(',');
      amenityList.forEach((amenity, index) => {
        qb.andWhere(qb => {
          const subQuery = qb.subQuery()
            .select('ha.hostelId')
            .from('hostel_amenities', 'ha')
            .innerJoin('amenities', 'a', 'a.id = ha.amenityId')
            .where('ha.hostelId = hostel.id')
            .andWhere('a.slug = :amenity' + index, { ['amenity' + index]: amenity })
            .getQuery();
          return 'EXISTS ' + subQuery;
        });
      });
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
    const hostels = await this.hostelRepository.find({
      where: [
        { status: HostelStatus.SUBMITTED },
        { status: HostelStatus.INSPECTION_SCHEDULED },
        { status: HostelStatus.UNDER_REVIEW }
      ],
      relations: ['owner', 'owner.ownerProfile', 'images', 'amenities'],
      order: { createdAt: 'DESC' }
    });

    for (const hostel of hostels) {
      if (hostel.owner?.id) {
        const verificationRequest = await this.hostelRepository.manager
          .getRepository('OwnerVerificationRequest')
          .findOne({
            where: { userId: hostel.owner.id },
            order: { createdAt: 'DESC' }
          });
        if (verificationRequest && hostel.owner.ownerProfile) {
          hostel.owner.ownerProfile.verificationRequest = verificationRequest;
        }
      }
    }

    return hostels;
  }

  async findAllHistory(): Promise<Hostel[]> {
    const hostels = await this.hostelRepository.find({
      where: [
        { status: HostelStatus.VERIFIED },
        { status: HostelStatus.REJECTED },
        { status: HostelStatus.DISABLED }
      ],
      relations: ['owner', 'owner.ownerProfile', 'images'],
      order: { updatedAt: 'DESC' }
    });

    for (const hostel of hostels) {
      if (hostel.owner?.id) {
        const verificationRequest = await this.hostelRepository.manager
          .getRepository('OwnerVerificationRequest')
          .findOne({
            where: { userId: hostel.owner.id },
            order: { createdAt: 'DESC' }
          });
        if (verificationRequest && hostel.owner.ownerProfile) {
          hostel.owner.ownerProfile.verificationRequest = verificationRequest;
        }
      }
    }

    return hostels;
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

    const em = this.hostelRepository.manager;

    await em.transaction(async (transactionalEntityManager) => {
      // 1. Get all bookings for this hostel
      const bookings = await transactionalEntityManager.query(
        `SELECT id FROM bookings WHERE hostel_id = $1`,
        [id]
      );

      // Defer constraints validation in Postgres if possible
      await transactionalEntityManager.query('SET CONSTRAINTS ALL DEFERRED').catch(() => {});

      // 2. Loop through and delete each booking using the robust cleanup queries
      for (const b of bookings) {
        const bookingId = b.id;
        const cleanupQueries = [
            { q: `DELETE FROM payouts WHERE payment_id IN (SELECT id FROM payments WHERE booking_id = $1)`, t: 'payouts' },
            { q: `DELETE FROM refunds WHERE booking_id = $1`, t: 'refunds' },
            { q: `DELETE FROM payment_gateway_logs WHERE booking_id = $1`, t: 'payment_gateway_logs' },
            { q: `UPDATE payment_gateway_logs SET booking_id = NULL WHERE booking_id = $1`, t: 'payment_gateway_logs set null' },
            { q: `DELETE FROM payments WHERE booking_id = $1`, t: 'payments' },
            { q: `DELETE FROM review_category_ratings WHERE review_id IN (SELECT id FROM reviews WHERE booking_id = $1)`, t: 'review_category_ratings' },
            { q: `DELETE FROM reviews WHERE booking_id = $1`, t: 'reviews' },
            { q: `DELETE FROM active_stays WHERE booking_id = $1`, t: 'active_stays' },
            { q: `DELETE FROM complaint_escalations WHERE complaint_id IN (SELECT id FROM complaints WHERE booking_id = $1)`, t: 'complaint_escalations' },
            { q: `DELETE FROM complaints WHERE booking_id = $1`, t: 'complaints' },
            { q: `UPDATE complaints SET booking_id = NULL WHERE booking_id = $1`, t: 'complaints set null' },
            { q: `DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE booking_id = $1)`, t: 'messages' },
            { q: `DELETE FROM conversations WHERE booking_id = $1`, t: 'conversations' },
            { q: `UPDATE conversations SET booking_id = NULL WHERE booking_id = $1`, t: 'conversations set null' },
            { q: `DELETE FROM email_logs WHERE reference_id = $1`, t: 'email_logs' },
            { q: `DELETE FROM audit_logs WHERE entity_id = $1`, t: 'audit_logs' },
            { q: `DELETE FROM notifications WHERE reference_id = $1`, t: 'notifications' },
            { q: `DELETE FROM admin_notes WHERE entity_id = $1`, t: 'admin_notes' },
            { q: `DELETE FROM bookings WHERE id = $1`, t: 'bookings' }
        ];

        for (const query of cleanupQueries) {
            try {
                await transactionalEntityManager.query(query.q, [bookingId]);
            } catch (err) {
                this.logger.warn(`Hostel-Booking Cleanup skipped for ${query.t}: ${err.message}`);
            }
        }
      }

      // 3. Cleanup any other hostel-level dependencies that might remain
      const hostelCleanupQueries = [
          { q: `DELETE FROM payouts WHERE owner_id = (SELECT owner_id FROM hostels WHERE id = $1)`, t: 'hostel payouts' },
          { q: `DELETE FROM refunds WHERE hostel_id = $1`, t: 'hostel refunds' },
          { q: `DELETE FROM payments WHERE hostel_id = $1`, t: 'hostel payments' },
          { q: `DELETE FROM reviews WHERE hostel_id = $1`, t: 'hostel reviews' },
          { q: `DELETE FROM active_stays WHERE hostel_id = $1`, t: 'hostel active_stays' },
          { q: `DELETE FROM complaint_escalations WHERE complaint_id IN (SELECT id FROM complaints WHERE hostel_id = $1)`, t: 'hostel complaint_escalations' },
          { q: `DELETE FROM complaints WHERE hostel_id = $1`, t: 'hostel complaints' },
          { q: `DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE hostel_id = $1)`, t: 'hostel messages' },
          { q: `DELETE FROM conversations WHERE hostel_id = $1`, t: 'hostel conversations' },
          { q: `DELETE FROM saved_hostels WHERE hostel_id = $1`, t: 'hostel saved_hostels' },
          { q: `DELETE FROM hostel_inspection_reports WHERE hostel_id = $1`, t: 'hostel inspection reports' },
          { q: `DELETE FROM hostel_documents WHERE hostel_id = $1`, t: 'hostel documents' },
          { q: `DELETE FROM hostel_amenities WHERE hostel_id = $1`, t: 'hostel amenities' },
          { q: `DELETE FROM hostel_images WHERE hostel_id = $1`, t: 'hostel images' },
          { q: `DELETE FROM room_images WHERE room_id IN (SELECT id FROM rooms WHERE hostel_id = $1)`, t: 'room images' },
          { q: `DELETE FROM rooms WHERE hostel_id = $1`, t: 'hostel rooms' }
      ];

      for (const query of hostelCleanupQueries) {
          try {
              await transactionalEntityManager.query(query.q, [id]);
          } catch (err) {
              this.logger.warn(`Hostel Cleanup skipped for ${query.t}: ${err.message}`);
          }
      }

      // 4. Finally delete the hostel itself via raw SQL
      try {
          await transactionalEntityManager.query(`DELETE FROM hostels WHERE id = $1`, [id]);
          this.logger.log(`Successfully deleted hostel ${id} and all its dependencies.`);
      } catch (err) {
          this.logger.error(`CRITICAL: FINAL DELETE FAILED for hostel ${id}: ${err.message}`);
          throw err;
      }
    });
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
