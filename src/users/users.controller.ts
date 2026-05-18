import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: 'da6iwndzu',
  api_key: '253618236271969',
  api_secret: 'Q-8o3DSeYRluMRhONRVrJhlGUsE'
});
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.sub);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateUserDto) {
    // Prevent users from changing their own role or status via profile endpoint
    const { role, status, ...profileData } = dto;
    await this.usersService.update(user.sub, profileData);
    return this.usersService.findOne(user.sub);
  }

  @Post('profile/image')
  @ApiOperation({ summary: 'Upload profile image' })
  @UseInterceptors(FileInterceptor('image', {
    storage: new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
        const format = ['jpg', 'jpeg', 'png', 'gif'].includes(ext) ? ext : 'jpg';
        return {
          folder: 'roomzy/profiles',
          format: format
        };
      }
    } as any),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|jfif)$/i)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    }
  }))
  async uploadProfileImage(@CurrentUser() user: any, @UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Image file is required');
    
    // multer-storage-cloudinary puts the secure_url in file.path
    const imageUrl = file.path;
    await this.usersService.update(user.sub, { profileImageUrl: imageUrl });
    const updatedUser = await this.usersService.findOne(user.sub);
    
    return {
      message: 'Profile image uploaded successfully',
      imageUrl,
      user: updatedUser
    };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single user by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user details (Admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Post('admin/create')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin create a new user directly' })
  adminCreate(@Body() dto: any) {
    return this.usersService.adminCreateUser(dto);
  }
}
