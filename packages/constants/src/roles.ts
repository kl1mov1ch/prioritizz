/** Platform-wide RBAC roles. Stored on User.roles[] and AdminUser. */
export const ROLES = {
  USER: 'USER',
  SELLER: 'SELLER',
  SUPPORT: 'SUPPORT',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPERADMIN: 'SUPERADMIN',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Roles allowed to reach the admin panel. */
export const ADMIN_ROLES: Role[] = [ROLES.SUPPORT, ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPERADMIN];

/** Coarse capability groups — used by the admin UI to gate sections. */
export const PERMISSIONS = {
  USERS_MANAGE: 'users.manage',
  SELLERS_MANAGE: 'sellers.manage',
  CATALOG_MODERATE: 'catalog.moderate',
  ORDERS_MANAGE: 'orders.manage',
  DISPUTES_RESOLVE: 'disputes.resolve',
  PAYOUTS_APPROVE: 'payouts.approve',
  COMMISSIONS_MANAGE: 'commissions.manage',
  SUBSCRIPTIONS_MANAGE: 'subscriptions.manage',
  FEATURE_FLAGS_MANAGE: 'featureFlags.manage',
  AUDIT_READ: 'audit.read',
  SUPPORT_HANDLE: 'support.handle',
  FINANCE_ADJUST: 'finance.adjust',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  USER: [],
  SELLER: [],
  SUPPORT: [PERMISSIONS.SUPPORT_HANDLE, PERMISSIONS.AUDIT_READ],
  MODERATOR: [
    PERMISSIONS.CATALOG_MODERATE,
    PERMISSIONS.SUPPORT_HANDLE,
    PERMISSIONS.DISPUTES_RESOLVE,
    PERMISSIONS.AUDIT_READ,
  ],
  ADMIN: [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.SELLERS_MANAGE,
    PERMISSIONS.CATALOG_MODERATE,
    PERMISSIONS.ORDERS_MANAGE,
    PERMISSIONS.DISPUTES_RESOLVE,
    PERMISSIONS.PAYOUTS_APPROVE,
    PERMISSIONS.COMMISSIONS_MANAGE,
    PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    PERMISSIONS.FEATURE_FLAGS_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.SUPPORT_HANDLE,
  ],
  SUPERADMIN: Object.values(PERMISSIONS),
};
