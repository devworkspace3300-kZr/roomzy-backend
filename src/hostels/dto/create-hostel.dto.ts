import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray, Min, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GenderType } from '../../common/enums/gender-type.enum';

export class CreateHostelDto {
  // Step 1: Basic Info
  @ApiProperty() @IsString() @IsNotEmpty() name: string;
  @ApiProperty() @IsString() @IsNotEmpty() description: string;
  @ApiProperty() @IsString() @IsNotEmpty() city: string;
  @ApiProperty() @IsOptional() @IsUUID() cityId?: string;
  @ApiProperty() @IsString() @IsNotEmpty() area: string;
  @ApiProperty() @IsString() @IsNotEmpty() fullAddress: string;
  @ApiProperty({ enum: GenderType }) @IsEnum(GenderType) genderType: GenderType;

  // Step 2: Location
  @ApiProperty() @IsOptional() @IsNumber() latitude?: number;
  @ApiProperty() @IsOptional() @IsNumber() longitude?: number;
  @ApiProperty() @IsOptional() @IsString() googleMapsUrl?: string;
  @ApiProperty() @IsOptional() @IsUUID() nearestInstituteId?: string;
  @ApiProperty() @IsOptional() @IsNumber() instituteDistanceKm?: number;

  // Step 3: Amenities
  @ApiProperty({ type: [String], description: 'Array of Amenity UUIDs' })
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) amenityIds?: string[];

  // Step 4: Media
  @ApiProperty({ type: [String], description: 'URLs of uploaded images' })
  @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];
  
  @ApiProperty() @IsOptional() @IsString() coverImage?: string;
  @ApiProperty() @IsOptional() @IsString() videoUrl?: string;

  // Step 5: Submission
  @ApiProperty() @IsOptional() @IsNumber() @Min(0) startingPrice?: number;
  @ApiProperty() @IsOptional() @IsNumber() totalFloors?: number;
  @ApiProperty() @IsOptional() @IsNumber() totalRoomsCount?: number;
  @ApiProperty() @IsOptional() @IsBoolean() isDraft?: boolean;
}
