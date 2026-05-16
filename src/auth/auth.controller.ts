import {
  Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
 
import { AuthService }    from './auth.service';
import { RegisterDto }    from './dto/register.dto';
import { LoginDto }       from './dto/login.dto';
import { JwtAuthGuard }   from '../common/guards/jwt-auth.guard';
import { CurrentUser }    from '../common/decorators/current-user.decorator';
 
@ApiTags('Auth')  // Groups endpoints under 'Auth' in Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
 
  // POST /api/v1/auth/register
  @Post('register')
  @ApiOperation({ summary: 'Register a new student or owner account' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }
 
  // POST /api/v1/auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK)  // Return 200 instead of default 201
  @ApiOperation({ summary: 'Login and receive JWT token' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
 
  // GET /api/v1/auth/me  — protected route
  @Get('me')
  @UseGuards(JwtAuthGuard)  // This route requires a valid JWT
  @ApiBearerAuth()          // Swagger shows the lock icon
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub);
  }
}
