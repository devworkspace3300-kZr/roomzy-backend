import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':bookingId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Submit a review for a completed booking' })
  async createReview(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: any
  ) {
    return this.reviewsService.createReview(user.sub, bookingId, dto);
  }

  @Get('hostel/:hostelId')
  @ApiOperation({ summary: 'Get all approved reviews for a hostel' })
  async getHostelReviews(@Param('hostelId') hostelId: string) {
    return this.reviewsService.getHostelReviews(hostelId);
  }

  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all reviews for moderation' })
  async getAllReviewsForAdmin() {
    return this.reviewsService.getAllReviewsAdmin();
  }

  @Patch(':id/approve')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Approve a review (Admin only)' })
  async approveReview(@Param('id') id: string) {
    return this.reviewsService.approveReview(id);
  }

  @Patch(':id/reject')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reject a review (Admin only)' })
  async rejectReview(@Param('id') id: string) {
    return this.reviewsService.rejectReview(id);
  }
}
