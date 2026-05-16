import { createParamDecorator, ExecutionContext } from '@nestjs/common';
 
// Usage: @CurrentUser() user: any  inside a controller method
// Returns the decoded JWT payload: { sub, email, role }
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Set by JwtAuthGuard
  },
);
