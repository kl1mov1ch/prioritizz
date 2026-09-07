import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import type { CreateOrderInput, OrderListQuery } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { CommissionEngine } from '../commissions/commission-engine';
import { OrderStateMachine } from './order.state-machine';
import { EscrowService } from '../escrow/escrow.service';
import { loadEnv } from '@prioritizz/config';

const D = Prisma.Decimal;
const REF_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

@Injectable()
export class OrdersService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly commissions: CommissionEngine,
    private readonly sm: OrderStateMachine,
    private readonly escrow: EscrowService,
  ) {}

  async create(buyerId: string, input: CreateOrderInput) {
    const service = await this.prisma.service.findFirst({
      where: { id: input.serviceId, deletedAt: null },
      include: { seller: true, variants: true },
    });
    if (!service) throw AppException.notFound('Service', input.serviceId);
    if (service.status !== 'ACTIVE') {
      throw new AppException(ERROR_CODES.SERVICE_INACTIVE, 'Service is not available');
    }
    if (service.seller.userId === buyerId) {
      throw AppException.validation('You cannot buy your own service');
    }

    const variant = input.variantId
      ? service.variants.find((v) => v.id === input.variantId && v.isActive)
      : service.variants.find((v) => v.isDefault && v.isActive);
    if (input.variantId && !variant) throw AppException.notFound('ServiceVariant', input.variantId);

    const qty = Math.min(Math.max(input.quantity, service.minQuantity), service.maxQuantity);
    const unit = new D(variant?.priceAmount ?? service.basePriceAmount);
    const gross = unit.mul(qty);
    const discount = new D(0); // promo evaluation lands with the promo module

    if (service.perBuyerLimit > 0) {
      const priorCount = await this.prisma.order.count({
        where: {
          buyerId,
          serviceId: service.id,
          status: { notIn: ['CANCELED', 'EXPIRED', 'REFUNDED'] },
        },
      });
      if (priorCount >= service.perBuyerLimit) {
        throw new AppException(ERROR_CODES.ORDER_LIMIT_EXCEEDED, 'Per-buyer limit reached');
      }
    }

    const total = gross.sub(discount);
    const snapshot = await this.commissions.resolve({
      grossAmount: total,
      serviceKind: service.kind,
      categoryId: service.categoryId,
      sellerId: service.sellerId,
      sellerTier: service.seller.tier,
      premiumDiscountBps: 0,
      promoCode: input.promoCode,
    });

    const reference = await this.uniqueReference();
    const order = await this.prisma.order.create({
      data: {
        reference,
        buyerId,
        sellerId: service.sellerId,
        serviceId: service.id,
        variantId: variant?.id ?? null,
        status: 'PENDING_PAYMENT',
        paymentStatus: 'REQUIRES_PAYMENT',
        escrowStatus: 'NONE',
        currency: service.currency,
        quantity: qty,
        grossAmount: gross,
        discountAmount: discount,
        totalAmount: total,
        sellerNetAmount: new D(snapshot.sellerNetAmount),
        commissionSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        buyerNote: input.buyerNote,
        buyerFields: input.fields as Prisma.InputJsonValue,
        paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
        events: {
          create: {
            type: 'created',
            toStatus: 'PENDING_PAYMENT',
            actorType: 'BUYER',
            actorId: buyerId,
          },
        },
      },
    });

    return this.get(buyerId, order.id);
  }

  async list(userId: string, query: OrderListQuery) {
    const where: Prisma.OrderWhereInput =
      query.role === 'seller'
        ? { seller: { userId }, status: query.status }
        : { buyerId: userId, status: query.status };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        include: this.include(),
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((o) => this.serialize(o, userId)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async get(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ buyerId: userId }, { seller: { userId } }] },
      include: this.include(),
    });
    if (!order) throw AppException.notFound('Order', orderId);
    return this.serialize(order, userId);
  }

  async timeline(userId: string, orderId: string) {
    await this.get(userId, orderId); // authorization
    const events = await this.prisma.orderEvent.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    });
    return events.map((e) => ({
      id: e.id,
      type: e.type,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      actorType: e.actorType,
      actorId: e.actorId,
      message: e.message,
      createdAt: e.createdAt.toISOString(),
    }));
  }

  async cancel(userId: string, orderId: string, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, OR: [{ buyerId: userId }, { seller: { userId } }] },
      });
      if (!order) throw AppException.notFound('Order', orderId);
      if (!['DRAFT', 'PENDING_PAYMENT'].includes(order.status)) {
        throw new AppException(
          ERROR_CODES.ORDER_INVALID_TRANSITION,
          'Only unpaid orders can be canceled directly; open a dispute instead',
        );
      }
      await this.sm.transition(tx, order, 'CANCELED', {
        actorType: order.buyerId === userId ? 'BUYER' : 'SELLER',
        actorId: userId,
        message: reason,
        eventName: DOMAIN_EVENTS.ORDER_CANCELED,
      });
      await tx.order.update({ where: { id: orderId }, data: { canceledAt: new Date() } });
      return this.get(userId, orderId);
    });
  }

  async deliver(userId: string, orderId: string, payload?: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, seller: { userId } },
      });
      if (!order) throw AppException.notFound('Order', orderId);
      if (!['IN_ESCROW', 'IN_PROGRESS'].includes(order.status)) {
        throw new AppException(
          ERROR_CODES.ORDER_INVALID_TRANSITION,
          `Cannot deliver from ${order.status}`,
        );
      }
      const autoReleaseAt = new Date(Date.now() + this.env.ESCROW_AUTO_RELEASE_HOURS * 3600 * 1000);
      await this.sm.transition(tx, order, 'DELIVERED', {
        actorType: 'SELLER',
        actorId: userId,
        message: note,
        eventName: DOMAIN_EVENTS.ORDER_DELIVERED,
      });
      await tx.order.update({
        where: { id: orderId },
        data: {
          deliveredAt: new Date(),
          autoReleaseAt,
          deliveryPayload: payload ?? order.deliveryPayload,
        },
      });
      // NOTE: schedule ESCROW_AUTO_RELEASE job on the ESCROW_TIMERS queue (M4).
      return this.get(userId, orderId);
    });
  }

  async confirm(userId: string, orderId: string, review?: { rating: number; text?: string }) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({ where: { id: orderId, buyerId: userId } });
      if (!order) throw AppException.notFound('Order', orderId);
      if (order.status !== 'DELIVERED') {
        throw new AppException(
          ERROR_CODES.ORDER_INVALID_TRANSITION,
          `Cannot confirm from ${order.status}`,
        );
      }
      const open = await tx.dispute.findFirst({
        where: {
          orderId,
          status: { in: ['OPEN', 'AWAITING_BUYER', 'AWAITING_SELLER', 'UNDER_REVIEW'] },
        },
      });
      if (open) {
        throw new AppException(
          ERROR_CODES.ORDER_INVALID_TRANSITION,
          'Order has an open dispute — resolve it first',
        );
      }
      // release() moves the ledger, marks the order COMPLETED and bumps stats.
      await this.escrow.release(
        tx,
        {
          id: order.id,
          status: order.status,
          version: order.version,
          currency: order.currency,
          sellerId: order.sellerId,
          sellerNetAmount: order.sellerNetAmount,
          commissionSnapshot: order.commissionSnapshot,
        },
        { type: 'BUYER', id: userId },
      );

      // Optional review captured at confirm time — recompute aggregates inline.
      if (review) {
        await tx.review.create({
          data: {
            orderId: order.id,
            serviceId: order.serviceId,
            sellerId: order.sellerId,
            authorId: userId,
            rating: review.rating,
            text: review.text ?? null,
          },
        });
        for (const [key, id] of [
          ['serviceId', order.serviceId],
          ['sellerId', order.sellerId],
        ] as const) {
          const agg = await tx.review.aggregate({
            where: { [key]: id, isHidden: false, deletedAt: null },
            _avg: { rating: true },
            _count: { rating: true },
          });
          const data = {
            ratingAvg: Math.round((agg._avg.rating ?? 0) * 100) / 100,
            ratingCount: agg._count.rating,
          };
          if (key === 'serviceId') await tx.service.update({ where: { id }, data });
          else await tx.sellerProfile.update({ where: { id }, data });
        }
      }
    });
    return this.get(userId, orderId);
  }

  // ---- helpers ----

  private include() {
    return {
      buyer: { select: { id: true, firstName: true, lastName: true, username: true } },
      seller: { select: { id: true, displayName: true } },
      service: { select: { id: true, title: true, kind: true, deliveryType: true } },
    } satisfies Prisma.OrderInclude;
  }

  private async uniqueReference(): Promise<string> {
    for (let i = 0; i < 5; i++) {
      const ref = `PRZ-${randomRef()}`;
      const exists = await this.prisma.order.findUnique({ where: { reference: ref } });
      if (!exists) return ref;
    }
    return `PRZ-${Date.now().toString(36).toUpperCase()}`;
  }

  private serialize(order: any, viewerId: string) {
    const buyerName =
      [order.buyer.firstName, order.buyer.lastName].filter(Boolean).join(' ') ||
      order.buyer.username ||
      'Buyer';
    const isBuyer = order.buyerId === viewerId;
    const canSeePayload =
      order.service.deliveryType === 'AUTO_INSTANT' ||
      ['DELIVERED', 'COMPLETED'].includes(order.status);
    return {
      id: order.id,
      reference: order.reference,
      status: order.status,
      paymentStatus: order.paymentStatus,
      escrowStatus: order.escrowStatus,
      currency: order.currency,
      quantity: order.quantity,
      grossAmount: order.grossAmount.toString(),
      discountAmount: order.discountAmount.toString(),
      totalAmount: order.totalAmount.toString(),
      commissionSnapshot: order.commissionSnapshot,
      sellerNetAmount: order.sellerNetAmount.toString(),
      autoReleaseAt: order.autoReleaseAt?.toISOString() ?? null,
      buyer: { id: order.buyer.id, displayName: buyerName },
      seller: { id: order.seller.id, displayName: order.seller.displayName },
      service: order.service,
      buyerNote: order.buyerNote,
      deliveryPayload: isBuyer && canSeePayload ? order.deliveryPayload : null,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
    };
  }
}

function randomRef(): string {
  let out = '';
  for (const b of randomBytes(6)) out += REF_CHARS[b % REF_CHARS.length];
  return out;
}
