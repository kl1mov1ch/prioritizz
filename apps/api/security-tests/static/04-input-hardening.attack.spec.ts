/**
 * ATTACK: loose request contracts that let hostile input through the pipe.
 */
import { describe, it, expect } from 'vitest';
import {
  createOrderSchema,
  paginationQuerySchema,
  idSchema,
  chatListQuerySchema,
  orderListQuerySchema,
} from '@prioritizz/schemas';

describe('F-07 createOrderSchema.quantity has no upper bound', () => {
  it('accepts quantity = 1e9 and Number.MAX_SAFE_INTEGER', () => {
    for (const quantity of [1_000_000_000, Number.MAX_SAFE_INTEGER]) {
      const r = createOrderSchema.safeParse({ serviceId: 'svc_12345', quantity });
      expect(r.success).toBe(true);
    }
  });
  it('accepts a fields record with hundreds of keys (no key-count cap)', () => {
    const fields: Record<string, string> = {};
    for (let i = 0; i < 500; i++) fields[`k${i}`] = 'v';
    const r = createOrderSchema.safeParse({ serviceId: 'svc_12345', fields });
    expect(r.success).toBe(true);
  });
});

describe('F-08 idSchema accepts arbitrary 8..64 char strings', () => {
  it('path/traversal- and SQL-looking ids pass validation (Prisma param binding is the only guard)', () => {
    for (const id of ["' OR 1=1 --", '../../../etc/passwd', '<script>alert(1)</script>x']) {
      expect(idSchema.safeParse(id).success).toBe(id.length >= 8 && id.length <= 64);
    }
  });
});

describe('F-09 paginationQuerySchema.page has no maximum', () => {
  it('accepts page = 1e12 -> skip = (page-1)*pageSize is handed to the DB', () => {
    const r = paginationQuerySchema.safeParse({ page: '1000000000000' });
    expect(r.success).toBe(true);
    expect(r.success && r.data.page).toBe(1_000_000_000_000);
  });
  it('orderListQuery inherits the same unbounded page', () => {
    expect(orderListQuerySchema.safeParse({ page: '999999999' }).success).toBe(true);
  });
});

describe('F-10 chatListQuerySchema.before is an opaque id used in a raw string comparison', () => {
  it('accepts any id-shaped string for `before` (becomes { id: { lt: before } })', () => {
    const r = chatListQuerySchema.safeParse({ before: 'zzzzzzzzzzzzzzzz' });
    expect(r.success).toBe(true);
  });
});
