import {
  Injectable, CanActivate, ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole }  from '../enums/user-role.enum';
 
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
 
  canActivate(context: ExecutionContext): boolean {
    // Step 1: Read required roles from @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
 
    // Step 2: If no @Roles() decorator, allow everyone
    if (!requiredRoles || requiredRoles.length === 0) return true;
 
    // Step 3: Get user from request (set by JwtAuthGuard)
    const { user } = context.switchToHttp().getRequest();
 
    // Step 4: Check if user role is in required roles list
    if (!requiredRoles.includes(user?.role)) {
      throw new ForbiddenException(
        `Access denied. Required role: ${requiredRoles.join(' or ')}`,
      );
    }
 
    return true;
  }
}
