import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import type { ServiceListQuery, ServiceUpsertInput } from '@prioritizz/schemas';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { MediaService } from '../media/media.service';

const SELLER_SELECT = {
  id: true,
  displayName: true,
  tier: true,
  ratingAvg: true,
  ratingCount: true,
  completedOrders: true,
  isVerified: true,
} as const;

/** Shape reused by every read and seller-facing write so responses stay identical. */
const SERVICE_INCLUDE = {
  category: { select: { id: true, slug: true, name: true } },
  seller: { select: SELLER_SELECT },
  variants: true,
} as const;

type MediaItem = { id: string; url: string; kind: string };

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
    private readonly media: MediaService,
  ) {}

  /** Batch-loads media for many services so a list is one extra query, not N. */
  private async mediaByService(serviceIds: string[]): Promise<Map<string, MediaItem[]>> {
    const out = new Map<string, MediaItem[]>();
    if (serviceIds.length === 0) return out;

    const rows = await this.prisma.attachment.findMany({
      where: {
        ownerType: 'SERVICE',
        ownerId: { in: serviceIds },
        isConfirmed: true,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      select: { id: true, url: true, kind: true, ownerId: true },
    });

    for (const r of rows) {
      if (!r.ownerId) continue; // not yet bound to a listing
      const list = out.get(r.ownerId) ?? [];
      list.push({ id: r.id, url: r.url, kind: r.kind });
      out.set(r.ownerId, list);
    }
    return out;
  }

  private async mediaFor(serviceId: string): Promise<MediaItem[]> {
    return (await this.mediaByService([serviceId])).get(serviceId) ?? [];
  }

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

  /**
   * `anyStatus` lifts the public ACTIVE-only default so a seller can see their
   * own drafts and paused listings.
   */
  async listServices(query: ServiceListQuery, opts: { anyStatus?: boolean } = {}) {
    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      status: query.status ?? (opts.anyStatus ? undefined : 'ACTIVE'),
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
        include: SERVICE_INCLUDE,
        orderBy: this.orderBy(query.sort),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    const media = await this.mediaByService(items.map((s) => s.id));

    return {
      items: items.map((s) => this.serialize(s, media.get(s.id) ?? [])),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async getService(idOrSlug: string) {
    const service = await this.prisma.service.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }], deletedAt: null },
      include: SERVICE_INCLUDE,
    });
    if (!service) throw AppException.notFound('Service', idOrSlug);
    return this.serialize(service, await this.mediaFor(service.id));
  }

  // ---- seller-side ----

  async createDraft(sellerId: string, userId: string, input: ServiceUpsertInput) {
    await this.assertCategory(input.categoryId);
    this.assertVariants(input);
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
      include: SERVICE_INCLUDE,
    });

    // Bind the uploads to the listing now that it has an id. Rejects any id the
    // caller does not own or has not confirmed.
    await this.media.claim(userId, 'SERVICE', service.id, input.attachmentIds ?? []);

    return this.serialize(service, await this.mediaFor(service.id));
  }

  /**
   * Full update of a seller's own listing. Variants are reconciled by id:
   * omitted ones are removed, known ids updated, new ones created — so the
   * client can send the whole array and not diff it itself.
   */
  async update(sellerId: string, userId: string, serviceId: string, input: ServiceUpsertInput) {
    const existing = await this.ownedService(sellerId, serviceId);
    if (existing.status === 'ARCHIVED') {
      throw new AppException(
        ERROR_CODES.SERVICE_NOT_PUBLISHABLE,
        'Archived listings are read-only',
      );
    }
    await this.assertCategory(input.categoryId);
    this.assertVariants(input);

    const keepIds = input.variants.map((v) => v.id).filter((id): id is string => !!id);

    await this.prisma.$transaction(async (tx) => {
      await tx.serviceVariant.deleteMany({
        where: { serviceId, id: { notIn: keepIds.length ? keepIds : ['__none__'] } },
      });

      for (const v of input.variants) {
        const data = {
          name: v.name,
          description: v.description ?? null,
          priceAmount: new Prisma.Decimal(v.priceAmount),
          isDefault: v.isDefault,
          stock: v.stock ?? null,
          isActive: v.isActive,
        };
        if (v.id) {
          // updateMany scopes by serviceId so a foreign variant id cannot be hijacked.
          await tx.serviceVariant.updateMany({ where: { id: v.id, serviceId }, data });
        } else {
          await tx.serviceVariant.create({ data: { ...data, serviceId } });
        }
      }

      await tx.service.update({
        where: { id: serviceId },
        data: {
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
          // Edits to a live listing go back through moderation.
          ...(existing.status === 'ACTIVE'
            ? { status: 'PENDING_REVIEW' as const, moderationStatus: 'PENDING' as const }
            : {}),
        },
      });
    });

    await this.media.claim(userId, 'SERVICE', serviceId, input.attachmentIds ?? []);

    const fresh = await this.prisma.service.findUniqueOrThrow({
      where: { id: serviceId },
      include: SERVICE_INCLUDE,
    });
    return this.serialize(fresh, await this.mediaFor(serviceId));
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
      include: SERVICE_INCLUDE,
    });
    this.events.emit(autoOk ? DOMAIN_EVENTS.SERVICE_APPROVED : DOMAIN_EVENTS.SERVICE_SUBMITTED, {
      serviceId,
      sellerId,
    });
    return this.serialize(updated, await this.mediaFor(serviceId));
  }

  async pause(sellerId: string, serviceId: string) {
    await this.ownedService(sellerId, serviceId);
    const s = await this.prisma.service.update({
      where: { id: serviceId },
      data: { status: 'PAUSED' },
      include: SERVICE_INCLUDE,
    });
    return this.serialize(s, await this.mediaFor(serviceId));
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

  /**
   * Business rules the Zod schema cannot express on its own. The schema already
   * guarantees one default and unique names; this guards the money invariant a
   * variant introduces.
   */
  private assertVariants(input: ServiceUpsertInput) {
    for (const v of input.variants) {
      if (new Prisma.Decimal(v.priceAmount).lte(0)) {
        throw AppException.validation(`Variant "${v.name}" must cost more than zero`);
      }
    }
    if (new Prisma.Decimal(input.basePriceAmount).lte(0)) {
      throw AppException.validation('Base price must be greater than zero');
    }
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

  private serialize(s: any, media: MediaItem[] = []) {
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
      soldCount: s.soldCount ?? 0,
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
      media,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    };
  }
}
