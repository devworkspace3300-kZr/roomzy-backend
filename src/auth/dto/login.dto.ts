import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty }         from '@nestjs/swagger';
 
export class LoginDto {
  @ApiProperty({ example: 'khizar@student.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
 
  @ApiProperty({ example: 'MyPass@123' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
