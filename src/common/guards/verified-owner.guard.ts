import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException, UnauthorizedException
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserRole } from '../enums/user-role.enum';
import { OwnerProfile } from '../../owners/entities/owner-profile.entity';

@Injectable()
export class VerifiedOwnerGuard implements CanActivate {
  constructor(private dataSource: DataSource) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Only owners need to be checked for verification status
    if (user.role !== UserRole.OWNER) {
      return true; 
    }

    // Fetch the owner's verification status from the database
    // We check the DB instead of the JWT because status might change without re-login
    const profile = await this.dataSource.getRepository(OwnerProfile).findOne({
      where: { userId: user.sub || user.id }
    });

    if (!profile || profile.verificationStatus !== 'verified') {
      throw new ForbiddenException(
        'Your account is pending verification. You cannot perform this action until an admin verifies your profile.'
      );
    }

    return true;
  }
}
