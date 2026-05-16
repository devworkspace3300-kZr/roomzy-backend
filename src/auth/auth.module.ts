import { Module }        from '@nestjs/common';
import { JwtModule }     from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { StringValue } from 'ms';
 
import { AuthController } from './auth.controller';
import { AuthService }    from './auth.service';
import { User }           from '../users/entities/user.entity';
 
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard }    from '../common/guards/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Give AuthService access to users table
 
    // Configure JWT — reads secret and expiry from .env
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = (config.get<StringValue>('JWT_EXPIRES_IN') ?? '7d') as StringValue;
        return {
          secret: config.get<string>('JWT_SECRET'),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, JwtAuthGuard, RolesGuard],
  exports:     [AuthService, JwtModule, JwtAuthGuard, RolesGuard],  // Export JwtModule so guards in other modules work
})
export class AuthModule {}
