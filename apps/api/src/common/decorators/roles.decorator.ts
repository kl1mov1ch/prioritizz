import { SetMetadata } from '@nestjs/common';
import type { Role } from '@prioritizz/constants';

export const ROLES_KEY = 'auth:roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const IS_PUBLIC_KEY = 'auth:public';
/** Skip JwtAuthGuard for this route. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ADMIN_ONLY_KEY = 'auth:adminSession';
/** Require the session to be an admin-panel session (isAdminSession = true). */
export const AdminOnly = () => SetMetadata(ADMIN_ONLY_KEY, true);
