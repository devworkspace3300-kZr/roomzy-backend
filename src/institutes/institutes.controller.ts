import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InstitutesService } from './institutes.service';

@ApiTags('Institutes')
@Controller('institutes')
export class InstitutesController {
  constructor(private readonly institutesService: InstitutesService) {}

  @Get()
  @ApiOperation({ summary: 'Get institutes with optional city and area filters' })
  findAll(
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('cityId') cityId?: string
  ) {
    return this.institutesService.findAll({ city, area, cityId });
  }
}
