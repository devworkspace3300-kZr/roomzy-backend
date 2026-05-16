import { Controller, Post, Get, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Add a room to a verified hostel (Owner only)' })
  create(@CurrentUser() user: any, @Body() dto: CreateRoomDto) {
    return this.roomsService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get available rooms for a hostel (Public)' })
  findByHostel(@Query('hostelId') hostelId: string) {
    return this.roomsService.findByHostel(hostelId);
  }

  @Get('manage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get all rooms for a hostel (Owner management view)' })
  @ApiBearerAuth()
  findAllByHostel(@Query('hostelId') hostelId: string, @CurrentUser() user: any) {
    return this.roomsService.findAllByHostel(hostelId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Update a room (Owner only)' })
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: Partial<CreateRoomDto>) {
    return this.roomsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Delete a room (Owner only)' })
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.roomsService.remove(id, user.sub);
  }
}
