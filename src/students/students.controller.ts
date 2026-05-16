import { Controller, Get, Put, Body, UseGuards, Post, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { UpdateStudentProfileDto } from './dto/update-student-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('student')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current student profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.studentsService.getProfile(user.sub);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update current student profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateStudentProfileDto) {
    return this.studentsService.updateProfile(user.sub, dto);
  }

  @Post('favorite/:hostelId')
  @ApiOperation({ summary: 'Toggle favorite status for a hostel' })
  async toggleFavorite(@CurrentUser() user: any, @Param('hostelId') hostelId: string) {
    return this.studentsService.toggleFavorite(user.sub, hostelId);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get list of saved hostels' })
  async getFavorites(@CurrentUser() user: any) {
    return this.studentsService.getFavorites(user.sub);
  }
}
