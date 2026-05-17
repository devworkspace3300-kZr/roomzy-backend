import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate/:bookingId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Initiate a PayFast payment session' })
  async initiate(@Param('bookingId') bookingId: string) {
    return this.paymentsService.initiatePayment(bookingId);
  }

  @Post('itn')
  @ApiOperation({ summary: 'PayFast ITN Callback (Webhook)' })
  async handleITN(@Body() data: any) {
    return this.paymentsService.handleITN(data);
  }

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get financial stats for admin dashboard' })
  async getStats() {
    return this.paymentsService.getFinanceStats();
  }

  @Get('owner/earnings')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @ApiOperation({ summary: 'Get owner earnings stats and transactions' })
  async getOwnerEarnings(@CurrentUser() user: any) {
    return this.paymentsService.getOwnerEarnings(user.id);
  }
}
