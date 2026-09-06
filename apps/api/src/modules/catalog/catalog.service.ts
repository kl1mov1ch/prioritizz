import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import type { ServiceListQuery, ServiceUpsertInput } from '@prioritizz/schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  async categories() {
    const rows = await this.prisma.category.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ order: 'asc' }, { name: 'asc' }],
    });
    const byId = new Map(rows.map((c) => [c.id, { ...c, children: [] as unknown[] }]));
    const roots: unknown[] = [];
    for (const c of byId.values()) {
      if (c.parentId && byId.has(c.parentId)) {
        (byId.get(c.parentId)!.children as unknown[]).push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  }

  async listServices(query: ServiceListQuery) {
    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      status: query.status ?? 'ACTIVE',
      categoryId: query.categoryId,
      kind: query.kind,
      deliveryType: query.deliveryType,
      sellerId: query.sellerId,
      tags: query.tag ? { has: query.tag } : undefined,
      basePriceAmount: this.priceRange(query.minPrice, query.maxPrice),
      OR: query.q
        ? [
            { title: { contains: query.q, mode: 'insensitive' } },
            { summary: { contains: query.q, mode: 'insensitive' } },
          ]
        : undefined,
    };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.service.count({ where }),
      this.prisma.service.findMany({
        where,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          seller: {
            select: { id: true, displayName: true, tier: true, ratingAvg: true, isVerified: true },
          },
          variants: true,
        },
        orderBy: this.orderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      items: items.map((s) => this.serialize(s)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getService(idOrSlug: string) {
    const service = await this.prisma.service.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        seller: {
          select: { id: true, displayName: true, tier: true, ratingAvg: true, isVerified: true },
        },
        variants: true,
      },
    });
    if (!service) throw AppException.notFound('Service', idOrSlug);
    return this.serialize(service);
  }

  // ---- seller-side ----

  async createDraft(sellerId: string, input: ServiceUpsertInput) {
    await this.assertCategory(input.categoryId);
    const slug = await this.uniqueSlug(input.title);
    const service = await this.prisma.service.create({
      data: {
        slug,
        sellerId,
        categoryId: input.categoryId,
        title: input.title,
        summary: input.summary,
        description: input.description,
        kind: input.kind,
        deliveryType: input.deliveryType,
        currency: input.currency,
        basePriceAmount: new Prisma.Decimal(input.basePriceAmount),
        slaHours: input.slaHours,
        refundPolicy: input.refundPolicy,
        terms: input.terms,
        tags: input.tags,
        minQuantity: input.minQuantity,
        maxQuantity: input.maxQuantity,
        perBuyerLimit: input.perBuyerLimit,
        autoModeration: input.autoModeration,
        sellerCommissionOverrideBps: input.sellerCommissionOverrideBps ?? null,
        status: 'DRAFT',
        variants: {
          create: input.variants.map((v) => ({
            name: v.name,
            description: v.description,
            priceAmount: new Prisma.Decimal(v.priceAmount),
            isDefault: v.isDefault,
            stock: v.stock ?? null,
            isActive: v.isActive,
          })),
        },
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        seller: {
          select: { id: true, displayName: true, tier: true, ratingAvg: true, isVerified: true },
        },
        variants: true,
      },
    });
    return this.serialize(service);
  }

  async submitForReview(sellerId: string, serviceId: string) {
    const service = await this.ownedService(sellerId, serviceId);
    if (!['DRAFT', 'REJECTED', 'PAUSED'].includes(service.status)) {
      throw new AppException(
        ERROR_CODES.SERVICE_NOT_PUBLISHABLE,
        `Cannot submit from ${service.status}`,
      );
    }
    const autoOk = service.autoModeration; // real auto-moderation checks land in M2
    const updated = await this.prisma.service.update({
      where: { id: serviceId },
      data: {
        status: autoOk ? 'ACTIVE' : 'PENDING_REVIEW',
        moderationStatus: autoOk ? 'APPROVED' : 'PENDING',
        publishedAt: autoOk ? new Date() : null,
        moderations: {
          create: { status: autoOk ? 'APPROVED' : 'PENDING', isAutomated: true },
        },
      },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        seller: {
          select: { id: true, displayName: true, tier: true, ratingAvg: true, isVerified: true },
        },
        variants: true,
      },
    });
    this.events.emit(autoOk ? DOMAIN_EVENTS.SERVICE_APPROVED : DOMAIN_EVENTS.SERVICE_SUBMITTED, {
      serviceId,
      sellerId,
    });
    return this.serialize(updated);
  }

  async pause(sellerId: string, serviceId: string) {
    await this.ownedService(sellerId, serviceId);
    const s = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: 'PAUSED' },
      include: {
        category: { select: { id: true, slug: true, name: true } },
        seller: {
          select: { id: true, displayName: true, tier: true, ratingAvg: true, isVerified: true },
        },
        variants: true,
      },
    });
    return this.serialize(s);
  }

  // ---- helpers ----

  private priceRange(min?: string, max?: string) {
    if (!min && !max) return undefined;
    return {
      gte: min ? new Prisma.Decimal(min) : undefined,
      lte: max ? new Prisma.Decimal(max) : undefined,
    };
  }

  private orderBy(sort?: string): Prisma.ServiceOrderByWithRelationInput {
    const allowed = [
      'createdAt',
      'publishedAt',
      'basePriceAmount',
      'ratingAvg',
      'soldCount',
    ] as const;
    const [field, dir] = (sort ?? '').split(':');
    if (!field || !(allowed as readonly string[]).includes(field)) {
      return { publishedAt: 'desc' };
    }
    return { [field]: dir === 'asc' ? 'asc' : 'desc' };
  }

  private async assertCategory(id: string) {
    const cat = await this.prisma.category.findFirst({ where: { id, deletedAt: null } });
    if (!cat) throw AppException.notFound('Category', id);
  }

  private async ownedService(sellerId: string, serviceId: string) {
    const s = await this.prisma.service.findFirst({
      where: { id: serviceId, sellerId, deletedAt: null },
    });
    if (!s) throw AppException.notFound('Service', serviceId);
    return s;
  }

  private async uniqueSlug(title: string): Promise<string> {
    const base =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50) || 'service';
    let slug = base;
    let n = 1;
    while (await this.prisma.service.findUnique({ where: { slug } })) slug = `${base}-${++n}`;
    return slug;
  }

  private serialize(s: any) {
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      summary: s.summary,
      description: s.description,
      kind: s.kind,
      deliveryType: s.deliveryType,
      status: s.status,
      moderationStatus: s.moderationStatus,
      category: s.category,
      currency: s.currency,
      basePriceAmount: s.basePriceAmount.toString(),
      slaHours: s.slaHours,
      refundPolicy: s.refundPolicy,
      terms: s.terms,
      tags: s.tags,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      ratingAvg: s.ratingAvg,
      ratingCount: s.ratingCount,
      seller: s.seller,
      variants: (s.variants ?? []).map((v: any) => ({
        id: v.id,
        name: v.name,
        description: v.description ?? undefined,
        priceAmount: v.priceAmount.toString(),
        isDefault: v.isDefault,
        stock: v.stock,
        isActive: v.isActive,
      })),
      media: [],
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
