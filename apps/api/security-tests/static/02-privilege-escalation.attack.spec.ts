/**
 * ATTACK: vertical privilege escalation via PATCH /v1/admin/users/:id.
 *
 * admin.service.updateUser() builds the new role set as:
 *     const roles = new Set(before.roles);
 *     (input.rolesAdd ?? []).forEach(r => roles.add(r));
 *
 * `adminUpdateUserSchema.rolesAdd` is `z.array(z.string())` — NOT constrained
 * to the Role enum. Any admin whose role grants PERMISSIONS.USERS_MANAGE
 * (that is ROLES.ADMIN, which is NOT SUPERADMIN) can therefore push the string
 * "SUPERADMIN" onto their own or any user's roles[] and gain every permission
 * (ROLE_PERMISSIONS.SUPERADMIN = Object.values(PERMISSIONS)).
 */
import { describe, it, expect } from 'vitest';
import { adminUpdateUserSchema } from '@prioritizz/schemas';
import { ROLE_PERMISSIONS, PERMISSIONS, ROLES } from '@prioritizz/constants';

describe('F-03 admin role update accepts arbitrary role strings', () => {
  it('rolesAdd:["SUPERADMIN"] passes validation', () => {
    const r = adminUpdateUserSchema.safeParse({
      rolesAdd: ['SUPERADMIN'],
      reason: 'escalate me',
    });
    expect(r.success).toBe(true);
  });

  it('rolesAdd accepts junk / injection-looking strings unrestricted', () => {
    const r = adminUpdateUserSchema.safeParse({
      rolesAdd: ["' OR 1=1 --", '../../root', 'GOD_MODE', ''],
      rolesRemove: ['USER'],
      reason: 'pollute the roles array',
    });
    expect(r.success).toBe(true);
  });
});

describe('F-03 privilege model confirms the escalation is meaningful', () => {
  it('ADMIN role has USERS_MANAGE but is not SUPERADMIN', () => {
    expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(PERMISSIONS.USERS_MANAGE);
    expect(ROLE_PERMISSIONS[ROLES.ADMIN]).not.toContain(PERMISSIONS.FINANCE_ADJUST);
  });

  it('SUPERADMIN grants every permission including FINANCE_ADJUST + PAYOUTS_APPROVE', () => {
    expect(ROLE_PERMISSIONS[ROLES.SUPERADMIN]).toContain(PERMISSIONS.FINANCE_ADJUST);
    expect(ROLE_PERMISSIONS[ROLES.SUPERADMIN]).toContain(PERMISSIONS.PAYOUTS_APPROVE);
    expect(ROLE_PERMISSIONS[ROLES.SUPERADMIN].length).toBeGreaterThan(
      ROLE_PERMISSIONS[ROLES.ADMIN].length,
    );
  });

  it('schema does not forbid an admin targeting their own id (no self-target guard in service either)', () => {
    // there is no field that scopes the target; the controller passes :id straight through
    const r = adminUpdateUserSchema.safeParse({ status: 'BANNED', reason: 'ban a peer admin' });
    expect(r.success).toBe(true);
  });
});
