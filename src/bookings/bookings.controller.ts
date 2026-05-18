import { Controller, Post, Get, Patch, Body, Param, UseGuards, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { OwnerBookingQueryDto } from './dto/owner-booking-query.dto';
import { BookingStatus } from '../common/enums/booking-status.enum';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Create a booking request (Student only)' })
  create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(user.sub, dto);
  }

  @Get('all')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get student\'s own bookings' })
  getMyBookings(@CurrentUser() user: any) {
    return this.bookingsService.findMyBookings(user.sub);
  }

  @Get('owner')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get booking requests for owner\'s hostels, optional status filter' })
  getOwnerBookings(@CurrentUser() user: any, @Query() query: OwnerBookingQueryDto) {
    return this.bookingsService.getOwnerBookingsByStatus(user.sub, query.status);
  }

  @Get('owner/active-stays')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get active stays for owner' })
  getActiveStays(@CurrentUser() user: any) {
    return this.bookingsService.getActiveStays(user.sub);
  }

  @Get('owner/:id/student')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get student profile for a booking (owner only, after approval)' })
  getStudentProfile(@Param('id') bookingId: string, @CurrentUser() user: any) {
    return this.bookingsService.getStudentProfile(bookingId, user.sub);
  }

  @Patch('owner/active-stays/:id/checkout')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Checkout a student from active stay' })
  checkoutActiveStay(@Param('id') bookingId: string, @CurrentUser() user: any) {
    return this.bookingsService.checkoutActiveStay(bookingId, user.sub);
  }

  @Patch('owner/bookings/:id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Approve a booking (Owner only)' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.respondToBooking(id, user.sub, BookingStatus.APPROVED);
  }

  @Patch('owner/bookings/:id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Reject a booking (Owner only)' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    return this.bookingsService.respondToBooking(id, user.sub, BookingStatus.REJECTED, rejectionReason);
  }

  @Patch('owner/bookings/:id/confirm-payment')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Confirm physical payment for a booking (Owner only)' })
  confirmPayment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.ownerConfirmPayment(id, user.sub);
  }

  @Patch('owner/bookings/:id/move-in')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Confirm student move-in / activate tenancy (Owner only)' })
  confirmMoveIn(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.bookingsService.ownerConfirmMoveIn(id, user.sub);
  }

  @Patch(':id/respond')
  @UseGuards(RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Legacy respond endpoint (Owner only)' })
  respond(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('status') status: BookingStatus,
    @Body('rejectionReason') rejectionReason?: string,
  ) {
    return this.bookingsService.respondToBooking(id, user.sub, status, rejectionReason);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Cancel a booking (Student only)' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('reason') reason?: string,
  ) {
    return this.bookingsService.cancelBooking(id, user.sub, reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a booking (Admin only)' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }

  @Patch(':id/admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a booking details (Admin only)' })
  adminUpdate(@Param('id') id: string, @Body() dto: any) {
    return this.bookingsService.adminUpdate(id, dto);
  }
}
