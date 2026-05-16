import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HostelsController } from './hostels.controller';
import { HostelsService } from './hostels.service';
import { Hostel } from './entities/hostel.entity';
import { HostelImage } from './entities/hostel-image.entity';
import { Amenity } from './entities/amenity.entity';
import { AuthModule } from '../auth/auth.module';

import { AmenitiesController } from './amenities.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Hostel, HostelImage, Amenity]),
    AuthModule,
  ],
  controllers: [HostelsController, AmenitiesController],
  providers: [HostelsService],
  exports: [HostelsService],
})
export class HostelsModule {}
