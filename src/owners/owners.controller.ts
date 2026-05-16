import { Controller, Get, Put, Post, Body, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { OwnersService } from './owners.service';
import { UpdateOwnerProfileDto } from './dto/update-owner-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

cloudinary.config({
  cloud_name: 'da6iwndzu',
  api_key: '253618236271969',
  api_secret: 'Q-8o3DSeYRluMRhONRVrJhlGUsE'
});

@ApiTags('Owners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('owner')
export class OwnersController {
  constructor(private readonly ownersService: OwnersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current owner profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.ownersService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current owner profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateOwnerProfileDto) {
    return this.ownersService.updateProfile(user.sub, dto);
  }

  @Post('verification-documents')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Upload verification documents (Owner only)' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'cnic_front', maxCount: 1 },
    { name: 'cnic_back', maxCount: 1 },
    { name: 'property_ownership', maxCount: 1 },
    { name: 'utility_bill', maxCount: 1 },
  ], {
    storage: require('multer').memoryStorage()
  }))
  async uploadVerificationDocs(
    @CurrentUser() user: any,
    @UploadedFiles() files: { 
      cnic_front?: any[], 
      cnic_back?: any[], 
      property_ownership?: any[],
      utility_bill?: any[] 
    }
  ) {
    if (!files || !files.cnic_front || !files.cnic_back || !files.property_ownership) {
      throw new BadRequestException('CNIC (Front & Back) and Property Ownership documents are required');
    }

    const uploadToCloudinary = async (file: any) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'roomzy/verification',
            resource_type: file.originalname.toLowerCase().endsWith('.pdf') ? 'raw' : 'image',
            access_mode: 'public',
            public_id: file.originalname.split('.')[0] + '-' + Date.now() + (file.originalname.toLowerCase().endsWith('.pdf') ? '.pdf' : ''),
          },
          (error, result) => {
            if (error || !result) return reject(error || new Error('Upload failed: No result from Cloudinary'));
            resolve(result.secure_url);
          }
        );
        uploadStream.end(file.buffer);
      });
    };

    try {
      const cnicFrontUrl = await uploadToCloudinary(files.cnic_front[0]);
      const cnicBackUrl = await uploadToCloudinary(files.cnic_back[0]);
      const propertyOwnershipUrl = await uploadToCloudinary(files.property_ownership[0]);
      const utilityBillUrl = files.utility_bill ? await uploadToCloudinary(files.utility_bill[0]) : null;

      await this.ownersService.submitVerificationDocuments(user.sub, {
        cnicFrontUrl: cnicFrontUrl as string,
        cnicBackUrl: cnicBackUrl as string,
        propertyOwnershipUrl: propertyOwnershipUrl as string,
        utilityBillUrl: utilityBillUrl as string,
      });

      return { message: 'Documents submitted successfully. Your profile is now under review.' };
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new BadRequestException('Failed to upload documents: ' + error.message);
    }
  }
}
