import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutesController } from './institutes.controller';
import { InstitutesService } from './institutes.service';
import { Institute } from './entities/institute.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Institute])],
  controllers: [InstitutesController],
  providers: [InstitutesService],
  exports: [InstitutesService],
})
export class InstitutesModule {}
