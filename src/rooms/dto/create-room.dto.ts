import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsUUID, Min, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RoomType } from '../../common/enums/room-type.enum';

export class CreateRoomDto {
  @ApiProperty() @IsUUID() hostelId: string;
  @ApiProperty() @IsOptional() @IsString() roomNumber?: string;
  @ApiProperty() @IsOptional() @IsString() roomName?: string;
  @ApiProperty({ enum: RoomType }) @IsEnum(RoomType) roomType: RoomType;
  @ApiProperty() @IsOptional() @IsNumber() floorNumber?: number;
  @ApiProperty() @IsNumber() @Min(1) totalBeds: number;
  @ApiProperty() @IsNumber() @Min(0) pricePerMonth: number;
  @ApiProperty() @IsOptional() @IsNumber() securityDeposit?: number;
  @ApiProperty() @IsBoolean() hasAttachedBathroom: boolean;
  @ApiProperty() @IsBoolean() hasAc: boolean;
  @ApiProperty() @IsOptional() @IsString() description?: string;
  
  @ApiProperty({ type: [String], description: 'URLs of uploaded room images' })
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
}
