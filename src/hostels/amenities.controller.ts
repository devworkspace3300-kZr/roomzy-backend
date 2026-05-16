import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Amenity } from '../hostels/entities/amenity.entity';

@ApiTags('Amenities')
@Controller('amenities')
export class AmenitiesController {
  constructor(
    @InjectRepository(Amenity)
    private readonly amenityRepo: Repository<Amenity>,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'ok', message: 'Amenities service is live' };
  }

  @Get()
  @ApiOperation({ summary: 'Get all amenities (Master list)' })
  findAll() {
    return this.amenityRepo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed initial amenities' })
  async seed() {
    const amenities = [
      { name: 'WiFi', slug: 'wifi', iconKey: 'wifi', category: 'connectivity' },
      { name: 'Meals Included', slug: 'meals', iconKey: 'utensils', category: 'food' },
      { name: 'Generator Backup', slug: 'generator', iconKey: 'zap', category: 'power' },
      { name: 'Air Conditioning', slug: 'ac', iconKey: 'wind', category: 'comfort' },
      { name: 'CCTV Security', slug: 'cctv', iconKey: 'video', category: 'security' },
      { name: 'Laundry Service', slug: 'laundry', iconKey: 'droplet', category: 'service' },
      { name: 'Car/Bike Parking', slug: 'parking', iconKey: 'truck', category: 'utility' },
      { name: '24/7 Security Guard', slug: 'security', iconKey: 'shield', category: 'security' },
      { name: 'Dedicated Study Room', slug: 'study-room', iconKey: 'book', category: 'comfort' },
    ];

    for (const item of amenities) {
      const existing = await this.amenityRepo.findOne({ where: { slug: item.slug } });
      if (!existing) {
        await this.amenityRepo.save(this.amenityRepo.create(item));
      }
    }
    return { message: 'Amenities seeded successfully' };
  }
}
