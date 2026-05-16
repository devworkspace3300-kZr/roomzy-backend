import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateOwnerProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnicFrontUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cnicBackUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyDocUrl?: string;
}
