import { Controller, Get, Patch, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('owners/pending')
  @ApiOperation({ summary: 'Get all pending owner verification requests' })
  async getPendingOwners() {
    return this.adminService.getPendingOwners();
  }

  @Patch('owners/:id/verify')
  @ApiOperation({ summary: 'Verify an owner account' })
  async verifyOwner(@Param('id') id: string, @CurrentUser() admin: any) {
    return this.adminService.verifyOwner(id, admin.sub);
  }

  @Patch('owners/:id/reject')
  @ApiOperation({ summary: 'Reject an owner verification request' })
  async rejectOwner(@Param('id') id: string, @CurrentUser() admin: any, @Body('reason') reason: string) {
    return this.adminService.rejectOwner(id, admin.sub, reason);
  }

  @Post('owners/:id/schedule-inspection')
  @ApiOperation({ summary: 'Schedule a physical property inspection' })
  async scheduleInspection(@Param('id') id: string, @CurrentUser() admin: any, @Body('scheduledAt') scheduledAt: Date) {
    return this.adminService.scheduleInspection(id, admin.sub, scheduledAt);
  }
}
