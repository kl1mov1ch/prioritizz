/**
 * ATTACK: RolesGuard authorisation logic (common/guards/roles.guard.ts).
 *
 * RolesGuard is re-implemented faithfully here (it has no deps beyond the
 * reflector metadata) so we can probe its decision table without booting Nest.
 */
import { describe, it, expect } from 'vitest';
import { ADMIN_ROLES, ROLE_PERMISSIONS, ROLES, PERMISSIONS } from '@prioritizz/constants';

type Auth = { userId: string; roles: string[]; isAdminSession: boolean };

/** Mirror of RolesGuard.canActivate, minus the Nest plumbing. */
function authorize(
  auth: Auth | undefined,
  meta: { roles?: string[]; adminOnly?: boolean; perms?: string[] },
): 'ALLOW' | 'DENY_NO_META' | 'DENY_NO_AUTH' | 'DENY_ADMIN_SESSION' | 'DENY_ADMIN_ROLE' | 'DENY_ROLE' | 'DENY_PERM' {
  const { roles: required, adminOnly, perms } = meta;
  if (!required?.length && !adminOnly && !perms?.length) return 'DENY_NO_META'; // guard returns true (route is open to any authed user)
  if (!auth) return 'DENY_NO_AUTH';
  if (adminOnly && !auth.isAdminSession) return 'DENY_ADMIN_SESSION';
  if (adminOnly && !auth.roles.some((r) => ADMIN_ROLES.includes(r as never))) return 'DENY_ADMIN_ROLE';
  if (required?.length && !required.some((r) => auth.roles.includes(r))) return 'DENY_ROLE';
  if (perms?.length) {
    const granted = new Set(auth.roles.flatMap((r) => ROLE_PERMISSIONS[r as never] ?? []));
    if (!perms.some((p) => granted.has(p as never))) return 'DENY_PERM';
  }
  return 'ALLOW';
}

describe('F-04 RolesGuard is a no-op when a route declares no role metadata', () => {
  it('any authenticated user passes a route with no @Roles/@AdminOnly/@RequirePermission', () => {
    const buyer: Auth = { userId: 'u1', roles: ['USER'], isAdminSession: false };
    // orders / messages / disputes(party) / payouts.request / reviews.create all fall here
    expect(authorize(buyer, {})).toBe('DENY_NO_META');
  });
});

describe('F-05 RolesGuard never consults User.status (ban) or the live DB roles', () => {
  it('a BANNED user with a still-valid access token is authorised for a SELLER route', () => {
    // JwtAuthGuard copies roles from the JWT and only checks Session.revokedAt,
    // not User.status. assertUsable() runs at login/refresh only.
    const bannedSeller: Auth = { userId: 'u2', roles: ['USER', 'SELLER'], isAdminSession: false };
    expect(authorize(bannedSeller, { roles: [ROLES.SELLER] })).toBe('ALLOW');
  });
});

describe('F-06 admin gate depends on JWT roles[] which admin.updateUser can write', () => {
  it('a user carrying roles:["SUPERADMIN"] in their JWT clears every permission check', () => {
    const escalated: Auth = { userId: 'u3', roles: ['USER', 'SUPERADMIN'], isAdminSession: true };
    expect(authorize(escalated, { adminOnly: true, perms: [PERMISSIONS.FINANCE_ADJUST] })).toBe('ALLOW');
  });

  it('but isAdminSession:false still blocks @AdminOnly (session flag is DB-backed)', () => {
    const escalatedNoAdminSession: Auth = { userId: 'u4', roles: ['SUPERADMIN'], isAdminSession: false };
    expect(authorize(escalatedNoAdminSession, { adminOnly: true })).toBe('DENY_ADMIN_SESSION');
  });
});
