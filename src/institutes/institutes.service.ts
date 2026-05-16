import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Institute } from './entities/institute.entity';

@Injectable()
export class InstitutesService {
  constructor(
    @InjectRepository(Institute)
    private readonly instituteRepo: Repository<Institute>,
  ) {}

  async findAll(query?: { cityId?: string; city?: string; area?: string }) {
    const where: any = {};
    
    if (query?.cityId) {
      where.cityId = query.cityId;
    }
    
    // Fallback or additional filters if needed
    // Note: Database schema currently uses cityId (UUID)
    
    return this.instituteRepo.find({ 
      where,
      order: { name: 'ASC' } 
    });
  }
}
