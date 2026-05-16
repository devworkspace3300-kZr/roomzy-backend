import { IsEmail, IsEnum, IsNotEmpty, MinLength, IsString, Matches, IsOptional, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole }    from '../../common/enums/user-role.enum';
 
export class RegisterDto {
  @ApiProperty({ example: 'Khizar Ahmad' })
  @IsNotEmpty({ message: 'Full name is required' })
  @IsString()
  fullName: string;
 
  @ApiProperty({ example: 'khizar@student.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
 
  @ApiProperty({ example: '03001234567' })
  @IsNotEmpty()
  @Matches(/^03[0-9]{9}$/, { message: 'Phone must be Pakistani format: 03XXXXXXXXX' })
  phone: string;
 
  @ApiProperty({ example: 'MyPass@123', minLength: 8 })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
 
  @ApiProperty({ enum: UserRole, example: 'student' })
  @IsEnum(UserRole, { message: 'Role must be student or owner' })
  role: UserRole;
 
  // --- Student Specific Fields ---
  @ApiProperty({ example: 'male', enum: ['male','female'], required: false })
  @ValidateIf(o => o.role === UserRole.STUDENT)
  @IsNotEmpty({ message: 'Gender is required for students' })
  @IsString()
  gender?: string;

  @ApiProperty({ example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  instituteId?: string;

  // --- Owner Specific Fields ---
  @ApiProperty({ example: 'Abbottabad', required: false })
  @ValidateIf(o => o.role === UserRole.OWNER)
  @IsNotEmpty({ message: 'City is required for owners' })
  @IsString()
  city?: string;

  @ApiProperty({ example: '1310112345671', required: false })
  @IsOptional()
  @IsString()
  cnic?: string;

  @ApiProperty({ example: 'Ahmad Hostels', required: false })
  @IsOptional()
  @IsString()
  businessName?: string;
}
