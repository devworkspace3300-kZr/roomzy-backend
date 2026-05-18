import { Controller, Post, Get, Patch, Body, UseGuards, Param, BadRequestException, Query, UseInterceptors, UploadedFile, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

cloudinary.config({
  cloud_name: 'da6iwndzu',
  api_key: '253618236271969',
  api_secret: 'Q-8o3DSeYRluMRhONRVrJhlGUsE'
});

import { HostelsService } from './hostels.service';
import { CreateHostelDto } from './dto/create-hostel.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { HostelStatus } from '../common/enums/hostel-status.enum';
import { GenderType } from '../common/enums/gender-type.enum';
import { VerifiedOwnerGuard } from '../common/guards/verified-owner.guard';

@ApiTags('Hostels')
@Controller('hostels')
export class HostelsController {
  constructor(private readonly hostelsService: HostelsService) {}

  @Get()
  @ApiOperation({ summary: 'Search and filter verified hostels (Public)' })
  findAll(
    @Query('city') city?: string,
    @Query('area') area?: string,
    @Query('genderType') genderType?: GenderType,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('institute') institute?: string,
    @Query('roomType') roomType?: string,
    @Query('amenities') amenities?: string,
  ) {
    return this.hostelsService.findAll({ city, area, genderType, minPrice, maxPrice, institute, roomType, amenities });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, VerifiedOwnerGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Submit a new hostel listing (Owner only)' })
  create(@CurrentUser() user: any, @Body() dto: CreateHostelDto) {
    return this.hostelsService.create(user.sub, dto);
  }

  @Post('image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Upload a single hostel image (Owner only)' })
  @UseInterceptors(FileInterceptor('image', {
    storage: new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
        const format = ['jpg', 'jpeg', 'png', 'gif', 'jfif'].includes(ext) ? ext : 'jpg';
        return {
          folder: 'roomzy/hostels',
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
  async uploadHostelImage(@UploadedFile() file: any) {
    if (!file) throw new BadRequestException('Image file is required');
    return { imageUrl: file.path };
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all pending hostels for verification (Admin only)' })
  findAllPending() {
    return this.hostelsService.findAllPending();
  }

  @Get('history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get history of verified/rejected hostels (Admin only)' })
  findAllHistory() {
    return this.hostelsService.findAllHistory();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get owner\'s own hostels' })
  findMyHostels(@CurrentUser() user: any) {
    return this.hostelsService.findByOwner(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single hostel by ID with rooms (Public)' })
  findOne(@Param('id') id: string) {
    return this.hostelsService.findOne(id);
  }

  @Patch(':id/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify or reject a hostel (Admin only)' })
  verify(@Param('id') id: string, @Body('status') status: HostelStatus, @Body('rejectedReason') rejectedReason?: string) {
    if (![HostelStatus.VERIFIED, HostelStatus.REJECTED].includes(status)) {
      throw new BadRequestException('Invalid status for verification');
    }
    return this.hostelsService.updateStatus(id, status, rejectedReason);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all hostels for management (Admin only)' })
  findAllAdmin() {
    return this.hostelsService.findAllAdmin();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update hostel details (Admin only)' })
  adminUpdate(@Param('id') id: string, @Body() dto: any) {
    return this.hostelsService.adminUpdate(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a hostel listing (Admin only)' })
  remove(@Param('id') id: string) {
    return this.hostelsService.remove(id);
  }
}

