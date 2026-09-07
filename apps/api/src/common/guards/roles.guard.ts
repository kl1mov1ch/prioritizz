import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission, Role } from '@prioritizz/constants';
import { ADMIN_ROLES, ROLE_PERMISSIONS } from '@prioritizz/constants';
import { AppException } from '../errors/app-exception';
import { ADMIN_ONLY_KEY, PERMISSIONS_KEY, ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthContext } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const targets = [ctx.getHandler(), ctx.getClass()];
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, targets);
    const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY_KEY, targets);
    const perms = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, targets);

    if (!required?.length && !adminOnly && !perms?.length) return true;

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
    if (perms?.length) {
      const granted = new Set<Permission>(
        auth.roles.flatMap((r) => ROLE_PERMISSIONS[r as Role] ?? []),
      );
      if (!perms.some((p) => granted.has(p))) {
        throw AppException.forbidden(`Requires permission: ${perms.join(' | ')}`);
      }
    }
    return true;
  }
}
