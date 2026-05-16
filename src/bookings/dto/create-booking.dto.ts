import { IsUUID, IsDateString, IsNumber, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty()
  @IsUUID()
  hostelId: string;

  @ApiProperty()
  @IsUUID()
  roomId: string;

  @ApiProperty()
  @IsDateString()
  moveInDate: string;

  @ApiProperty({ description: '1, 3, 6, or 12 months' })
  @IsNumber()
  @IsIn([1, 3, 6, 12])
  durationMonths: number;

  @ApiProperty({ required: false })
  @IsOptional() @IsString()
  notes?: string;
}
