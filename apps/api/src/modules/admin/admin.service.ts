import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Role } from '@prisma/client';
import type {
  AdminUpdateUserInput,
  CommissionRuleUpsertInput,
  ModerationDecisionInput,
} from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { AuditService } from '../../common/audit/audit.service';

const RANGE_MS: Record<string, number> = {
  '24h': 864e5,
  '7d': 7 * 864e5,
  '30d': 30 * 864e5,
  '90d': 90 * 864e5,
};

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---- dashboard ----

  async dashboard(range: string) {
    const since = new Date(Date.now() - (RANGE_MS[range] ?? 7 * 864e5));
    const [orders, completed, disputes, payouts, moderation, newUsers, activeSellers, refunded] =
      await this.prisma.$transaction([
        this.prisma.order.findMany({
          where: { createdAt: { gte: since }, paymentStatus: 'SUCCEEDED' },
          select: { totalAmount: true, commissionSnapshot: true, createdAt: true },
        }),
        this.prisma.order.count({ where: { status: 'COMPLETED', completedAt: { gte: since } } }),
        this.prisma.dispute.count({
          where: { status: { in: ['OPEN', 'AWAITING_BUYER', 'AWAITING_SELLER', 'UNDER_REVIEW'] } },
        }),
        this.prisma.payout.count({ where: { status: 'REQUESTED' } }),
        this.prisma.service.count({
          where: { moderationStatus: 'PENDING', status: 'PENDING_REVIEW' },
        }),
        this.prisma.user.count({ where: { createdAt: { gte: since } } }),
        this.prisma.sellerProfile.count({ where: { completedOrders: { gt: 0 } } }),
        this.prisma.order.count({
          where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] }, updatedAt: { gte: since } },
        }),
      ]);

    const gmv = orders.reduce((s, o) => s.add(o.totalAmount), new Prisma.Decimal(0));
    const revenue = orders.reduce(
      (s, o) => s.add((o.commissionSnapshot as { computedFee?: string })?.computedFee ?? '0'),
      new Prisma.Decimal(0),
    );

    // simple daily buckets
    const days = Math.max(1, Math.round((RANGE_MS[range] ?? 7 * 864e5) / 864e5));
    const series = Array.from({ length: Math.min(days, 30) }, (_, i) => {
      const day = new Date(Date.now() - (days - 1 - i) * 864e5);
      const key = day.toISOString().slice(0, 10);
      const dayOrders = orders.filter((o) => o.createdAt.toISOString().slice(0, 10) === key);
      return {
        date: key,
        orders: dayOrders.length,
        gmv: dayOrders.reduce((s, o) => s.add(o.totalAmount), new Prisma.Decimal(0)).toString(),
        revenue: dayOrders
          .reduce(
            (s, o) => s.add((o.commissionSnapshot as { computedFee?: string })?.computedFee ?? '0'),
            new Prisma.Decimal(0),
          )
          .toString(),
      };
    });

    return {
      range,
      gmv: gmv.toString(),
      revenue: revenue.toString(),
      ordersCount: orders.length,
      completedOrders: completed,
      activeDisputes: disputes,
      pendingPayouts: payouts,
      pendingModeration: moderation,
      newUsers,
      activeSellers,
      disputeRate: orders.length ? Math.round((disputes / orders.length) * 1000) / 10 : 0,
      refundRate: orders.length ? Math.round((refunded / orders.length) * 1000) / 10 : 0,
      series,
    };
  }

  // ---- users ----

  async listUsers(q: { page: number; pageSize: number; q?: string }) {
    const where: Prisma.UserWhereInput = q.q
      ? {
          OR: [
            { username: { contains: q.q, mode: 'insensitive' } },
            { firstName: { contains: q.q, mode: 'insensitive' } },
            ...(/^\d+$/.test(q.q) ? [{ telegramId: BigInt(q.q) }] : []),
          ],
        }
      : {};
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { sellerProfile: { select: { tier: true, ratingAvg: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      items: rows.map((u) => ({
        id: u.id,
        telegramId: u.telegramId.toString(),
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        roles: u.roles,
        status: u.status,
        isSeller: !!u.sellerProfile,
        sellerTier: u.sellerProfile?.tier ?? null,
        createdAt: u.createdAt.toISOString(),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    };
  }

  async updateUser(adminUserId: string, userId: string, input: AdminUpdateUserInput, ip?: string) {
    const before = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!before) throw AppException.notFound('User', userId);

    const roles = new Set<string>(before.roles);
    (input.rolesAdd ?? []).forEach((r) => roles.add(r));
    (input.rolesRemove ?? []).forEach((r) => roles.delete(r));
    roles.add('USER');

    const after = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: input.status ?? before.status,
        roles: [...roles] as Role[],
      },
    });

    if (input.status && ['SUSPENDED', 'BANNED'].includes(input.status)) {
      await this.prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await this.audit.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      action: 'user.update',
      targetType: 'User',
      targetId: userId,
      before: { status: before.status, roles: before.roles },
      after: { status: after.status, roles: after.roles, reason: input.reason },
      ip: ip ?? null,
    });
    return { id: after.id, status: after.status, roles: after.roles };
  }

  // ---- moderation ----

  async moderationQueue(q: { page: number; pageSize: number }) {
    const where: Prisma.ServiceWhereInput = { moderationStatus: 'PENDING', deletedAt: null };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        include: {
          seller: { select: { displayName: true, tier: true } },
          category: { select: { name: true } },
        },
        orderBy: { updatedAt: 'asc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      items: rows.map((s) => ({
        id: s.id,
        slug: s.slug,
        title: s.title,
        summary: s.summary,
        description: s.description,
        kind: s.kind,
        deliveryType: s.deliveryType,
        basePriceAmount: s.basePriceAmount.toString(),
        currency: s.currency,
        category: s.category.name,
        seller: s.seller.displayName,
        sellerTier: s.seller.tier,
        submittedAt: s.updatedAt.toISOString(),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    };
  }

  async moderate(adminUserId: string, serviceId: string, input: ModerationDecisionInput) {
    const admin = await this.prisma.adminUser.findUnique({ where: { userId: adminUserId } });
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) throw AppException.notFound('Service', serviceId);

    const map = {
      APPROVED: {
        status: 'ACTIVE' as const,
        moderationStatus: 'APPROVED' as const,
        publishedAt: new Date(),
      },
      REJECTED: {
        status: 'REJECTED' as const,
        moderationStatus: 'REJECTED' as const,
        publishedAt: null,
      },
      ESCALATED: { moderationStatus: 'ESCALATED' as const },
    };

    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...map[input.decision],
        moderations: {
          create: {
            status: input.decision,
            reviewerId: admin?.id ?? null,
            note: input.note,
          },
        },
      },
    });
    await this.audit.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      action: `service.moderate.${input.decision}`,
      targetType: 'Service',
      targetId: serviceId,
      after: { note: input.note },
    });
    return { id: updated.id, status: updated.status, moderationStatus: updated.moderationStatus };
  }

  // ---- commission rules ----

  async commissionRules() {
    const rows = await this.prisma.commissionRule.findMany({ orderBy: [{ priority: 'asc' }] });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      scope: r.scope,
      matcher: r.matcher,
      percentBps: r.percentBps,
      fixed: r.fixed.toString(),
      minFee: r.minFee.toString(),
      maxFee: r.maxFee?.toString() ?? null,
      priority: r.priority,
      isActive: r.isActive,
      activeFrom: r.activeFrom?.toISOString() ?? null,
      activeTo: r.activeTo?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async upsertCommissionRule(adminUserId: string, input: CommissionRuleUpsertInput, id?: string) {
    const data = {
      name: input.name,
      scope: input.scope,
      matcher: input.matcher as Prisma.InputJsonValue,
      percentBps: input.percentBps,
      fixed: new Prisma.Decimal(input.fixed ?? '0'),
      minFee: new Prisma.Decimal(input.minFee ?? '0'),
      maxFee: input.maxFee ? new Prisma.Decimal(input.maxFee) : null,
      priority: input.priority ?? 100,
      isActive: input.isActive ?? true,
      activeFrom: input.activeFrom ? new Date(input.activeFrom) : null,
      activeTo: input.activeTo ? new Date(input.activeTo) : null,
    };
    const rule = id
      ? await this.prisma.commissionRule.update({ where: { id }, data })
      : await this.prisma.commissionRule.create({ data });
    await this.audit.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      action: id ? 'commissionRule.update' : 'commissionRule.create',
      targetType: 'CommissionRule',
      targetId: rule.id,
      after: { name: rule.name, percentBps: rule.percentBps, scope: rule.scope },
    });
    return { id: rule.id };
  }

  async deleteCommissionRule(adminUserId: string, id: string) {
    await this.prisma.commissionRule.update({ where: { id }, data: { isActive: false } });
    await this.audit.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      action: 'commissionRule.disable',
      targetType: 'CommissionRule',
      targetId: id,
    });
    return { ok: true };
  }

  // ---- audit log ----

  async auditLog(q: { page: number; pageSize: number; action?: string; targetType?: string }) {
    const where: Prisma.AuditLogWhereInput = { action: q.action, targetType: q.targetType };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
    ]);
    return {
      items: rows.map((a) => ({
        id: a.id,
        actorType: a.actorType,
        actorId: a.actorId,
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId,
        before: a.before,
        after: a.after,
        ip: a.ip,
        createdAt: a.createdAt.toISOString(),
      })),
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    };
  }

  // ---- feature flags ----

  async featureFlags() {
    const rows = await this.prisma.featureFlag.findMany({ orderBy: { key: 'asc' } });
    return rows.map((f) => ({
      key: f.key,
      description: f.description,
      enabled: f.enabled,
      rolloutPercentage: f.rolloutPercentage,
      payload: (f.payload as Record<string, unknown> | null) ?? null,
      updatedAt: f.updatedAt.toISOString(),
    }));
  }

  async updateFeatureFlag(
    adminUserId: string,
    key: string,
    patch: { enabled?: boolean; rolloutPercentage?: number; payload?: unknown },
  ) {
    const flag = await this.prisma.featureFlag.update({
      where: { key },
      data: {
        enabled: patch.enabled,
        rolloutPercentage: patch.rolloutPercentage,
        payload: patch.payload === undefined ? undefined : (patch.payload as Prisma.InputJsonValue),
      },
    });
    await this.audit.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      action: 'featureFlag.update',
      targetType: 'FeatureFlag',
      targetId: key,
      after: { enabled: flag.enabled, rolloutPercentage: flag.rolloutPercentage },
    });
    return { key: flag.key, enabled: flag.enabled };
  }
}
