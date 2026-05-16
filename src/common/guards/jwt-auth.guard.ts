import {
  Injectable, CanActivate, ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
 
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService:    JwtService,
    private configService: ConfigService,
  ) {}
 
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
 
    // Step 1: Extract token from 'Authorization: Bearer TOKEN' header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }
 
    const token = authHeader.split(' ')[1];
 
    // Step 2: Verify token with your JWT secret
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
 
      // Step 3: Attach decoded payload to request.user
      // payload = { sub: 'uuid', email: 'x@y.com', role: 'student' }
      request.user = payload;
      return true;
 
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
