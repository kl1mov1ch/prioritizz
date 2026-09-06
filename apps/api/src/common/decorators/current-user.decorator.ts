import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export interface AuthContext {
  userId: string;
  sessionId: string;
  roles: string[];
  isAdminSession: boolean;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const req = ctx.switchToHttp().getRequest();
    return req.authContext as AuthContext;
  },
);
