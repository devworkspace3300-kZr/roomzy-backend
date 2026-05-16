import { SetMetadata } from '@nestjs/common';
import { UserRole }    from '../enums/user-role.enum';
 
export const ROLES_KEY = 'roles';
 
// Usage: @Roles(UserRole.OWNER)  or  @Roles(UserRole.ADMIN)
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
