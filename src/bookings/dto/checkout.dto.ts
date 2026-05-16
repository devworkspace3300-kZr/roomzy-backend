import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiPropertyOptional({ description: 'Optional notes for checkout' })
  @IsOptional()
  @IsString()
  notes?: string;
}
