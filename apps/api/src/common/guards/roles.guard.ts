import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Role } from '@prioritizz/constants';
import { ADMIN_ROLES } from '@prioritizz/constants';
import { AppException } from '../errors/app-exception';
import { ADMIN_ONLY_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthContext } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required?.length && !adminOnly) return true;

    const auth = ctx.switchToHttp().getRequest().authContext as AuthContext | undefined;
    if (!auth) throw AppException.forbidden('Not authenticated');

    if (adminOnly && !auth.isAdminSession) {
      throw AppException.forbidden('Admin session required');
    }
    if (adminOnly && !auth.roles.some((r) => ADMIN_ROLES.includes(r as Role))) {
      throw AppException.forbidden('Admin role required');
    }
    if (required?.length && !required.some((r) => auth.roles.includes(r))) {
      throw AppException.forbidden(`Requires one of: ${required.join(', ')}`);
    }
    return true;
  }
}
