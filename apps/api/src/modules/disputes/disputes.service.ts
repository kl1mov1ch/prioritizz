import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { DisputeStatus } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import { loadEnv } from '@prioritizz/config';
import type { DisputeListQuery, OpenDisputeInput, ResolveDisputeInput } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { OutboxService } from '../../common/outbox/outbox.service';
import { OrderStateMachine } from '../orders/order.state-machine';
import { EscrowService } from '../escrow/escrow.service';

const D = Prisma.Decimal;
// A COMPLETED order's escrow is already released — disputes must be opened
// while the funds are still held.
const DISPUTABLE = ['IN_ESCROW', 'IN_PROGRESS', 'DELIVERED'];

@Injectable()
export class DisputesService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly outbox: OutboxService,
    private readonly sm: OrderStateMachine,
    private readonly escrow: EscrowService,
  ) {}

  async open(userId: string, input: OpenDisputeInput) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: input.orderId, OR: [{ buyerId: userId }, { seller: { userId } }] },
        include: { dispute: true },
      });
      if (!order) throw AppException.notFound('Order', input.orderId);
      if (order.dispute)
        throw new AppException(ERROR_CODES.DISPUTE_ALREADY_OPEN, 'dispute already exists');
      if (!DISPUTABLE.includes(order.status)) {
        throw new AppException(
          ERROR_CODES.DISPUTE_WINDOW_CLOSED,
          `cannot dispute a ${order.status} order`,
        );
      }

      const openedByType = order.buyerId === userId ? 'BUYER' : 'SELLER';
      const slaDueAt = new Date(Date.now() + this.env.DISPUTE_SLA_HOURS * 3600 * 1000);

      const dispute = await tx.dispute.create({
        data: {
          orderId: order.id,
          status: openedByType === 'BUYER' ? 'AWAITING_SELLER' : 'AWAITING_BUYER',
          reason: input.reason,
          description: input.description,
          desiredOutcome: input.desiredOutcome,
          requestedAmount: input.requestedAmount ? new D(input.requestedAmount) : null,
          openedById: userId,
          openedByType,
          slaDueAt,
          messages: {
            create: { authorId: userId, authorType: openedByType, body: input.description },
          },
        },
      });

      // Freeze the escrow and the order — auto-release must not fire mid-dispute.
      if (order.status !== 'DISPUTED') {
        await this.sm.transition(tx, order, 'DISPUTED', {
          actorType: openedByType,
          actorId: userId,
          message: `dispute:${dispute.id}`,
          eventName: DOMAIN_EVENTS.DISPUTE_OPENED,
        });
      }
      await tx.order.update({ where: { id: order.id }, data: { autoReleaseAt: null } });
      await tx.escrowCase.updateMany({
        where: { orderId: order.id, status: 'HELD' },
        data: { status: 'FROZEN', frozenReason: `dispute ${dispute.id}` },
      });

      return this.get(userId, dispute.id, tx);
    });
  }

  async addMessage(userId: string, disputeId: string, body: string) {
    const d = await this.assertParty(userId, disputeId);
    const authorType = d.order.buyerId === userId ? 'BUYER' : 'SELLER';
    await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: authorType === 'BUYER' ? 'AWAITING_SELLER' : 'AWAITING_BUYER',
        messages: { create: { authorId: userId, authorType, body } },
      },
    });
    return this.get(userId, disputeId);
  }

  async listMine(userId: string, disputeId: string) {
    await this.assertParty(userId, disputeId);
    const msgs = await this.prisma.disputeMessage.findMany({
      where: { disputeId, isInternal: false },
      orderBy: { createdAt: 'asc' },
    });
    return msgs.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      body: m.body,
      mine: m.authorId === userId,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async get(
    userId: string,
    disputeId: string,
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const d = await tx.dispute.findFirst({
      where: {
        id: disputeId,
        OR: [{ order: { buyerId: userId } }, { order: { seller: { userId } } }],
      },
      include: { order: { select: { reference: true } }, resolution: true },
    });
    if (!d) throw AppException.notFound('Dispute', disputeId);
    return this.serialize(d);
  }

  // ---- admin ----

  async adminList(query: DisputeListQuery) {
    const where: Prisma.DisputeWhereInput = {
      status: query.status,
      ...(query.overdue ? { slaDueAt: { lt: new Date() }, resolution: null } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.dispute.count({ where }),
      this.prisma.dispute.findMany({
        where,
        include: { order: { select: { reference: true } }, resolution: true },
        orderBy: [{ slaDueAt: 'asc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      items: rows.map((d) => this.serialize(d)),
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: Math.ceil(total / query.pageSize),
    };
  }

  async adminThread(disputeId: string) {
    const msgs = await this.prisma.disputeMessage.findMany({
      where: { disputeId },
      orderBy: { createdAt: 'asc' },
    });
    return msgs.map((m) => ({
      id: m.id,
      authorType: m.authorType,
      authorId: m.authorId,
      body: m.body,
      isInternal: m.isInternal,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async resolve(adminUserId: string, disputeId: string, input: ResolveDisputeInput) {
    return this.prisma.$transaction(async (tx) => {
      const dispute = await tx.dispute.findUnique({
        where: { id: disputeId },
        include: { order: true, resolution: true },
      });
      if (!dispute) throw AppException.notFound('Dispute', disputeId);
      if (dispute.resolution) {
        throw new AppException(ERROR_CODES.DISPUTE_INVALID_TRANSITION, 'already resolved');
      }
      const order = dispute.order;
      const admin = await tx.adminUser.findUnique({ where: { userId: adminUserId } });

      const statusByOutcome: Record<string, DisputeStatus> = {
        RELEASE: 'RESOLVED_RELEASE',
        REFUND: 'RESOLVED_REFUND',
        SPLIT: 'RESOLVED_SPLIT',
        REJECT: 'REJECTED',
      };

      // Thaw the escrow so the ledger ops can run.
      await tx.escrowCase.updateMany({
        where: { orderId: order.id, status: 'FROZEN' },
        data: { status: 'HELD', frozenReason: null },
      });
      const fresh = await tx.order.findUniqueOrThrow({ where: { id: order.id } });

      if (input.outcome === 'RELEASE' || input.outcome === 'REJECT') {
        await this.escrow.release(
          tx,
          {
            id: fresh.id,
            status: fresh.status,
            version: fresh.version,
            currency: fresh.currency,
            sellerId: fresh.sellerId,
            sellerNetAmount: fresh.sellerNetAmount,
            commissionSnapshot: fresh.commissionSnapshot,
          },
          { type: 'ADMIN', id: adminUserId },
        );
      } else if (input.outcome === 'REFUND') {
        await this.escrow.refund(
          tx,
          {
            id: fresh.id,
            status: fresh.status,
            version: fresh.version,
            currency: fresh.currency,
            buyerId: fresh.buyerId,
          },
          input.refundAmount,
          { type: 'ADMIN', id: adminUserId },
        );
      } else if (input.outcome === 'SPLIT') {
        // Refund the buyer's share first, then release the rest to the seller.
        await this.escrow.refund(
          tx,
          {
            id: fresh.id,
            status: fresh.status,
            version: fresh.version,
            currency: fresh.currency,
            buyerId: fresh.buyerId,
          },
          input.refundAmount!,
          { type: 'ADMIN', id: adminUserId },
        );
        const mid = await tx.order.findUniqueOrThrow({ where: { id: order.id } });
        await this.escrow.release(
          tx,
          {
            id: mid.id,
            status: mid.status,
            version: mid.version,
            currency: mid.currency,
            sellerId: mid.sellerId,
            sellerNetAmount: mid.sellerNetAmount,
            commissionSnapshot: { computedFee: '0' }, // fee was taken at hold-time only on the released share; keep simple
          },
          { type: 'ADMIN', id: adminUserId },
        );
      }

      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: statusByOutcome[input.outcome],
          version: { increment: 1 },
          resolution: {
            create: {
              outcome: input.outcome,
              refundAmount: input.refundAmount ? new D(input.refundAmount) : null,
              rationale: input.rationale,
              penalizedSeller: input.penalizeSeller,
              resolvedByAdminId: admin?.id ?? null,
            },
          },
          messages: {
            create: {
              authorId: adminUserId,
              authorType: 'ADMIN',
              body: `Resolution: ${input.outcome}. ${input.rationale}`,
            },
          },
        },
      });

      if (input.penalizeSeller) {
        await tx.sellerProfile.update({
          where: { id: order.sellerId },
          data: { disputeRate: { increment: 0 } }, // recompute job owns the real number
        });
      }

      await this.outbox.emit(
        tx,
        DOMAIN_EVENTS.DISPUTE_RESOLVED,
        { disputeId, orderId: order.id, outcome: input.outcome },
        { type: 'ADMIN', id: adminUserId },
      );

      return this.serialize(
        await tx.dispute.findUniqueOrThrow({
          where: { id: disputeId },
          include: { order: { select: { reference: true } }, resolution: true },
        }),
      );
    });
  }

  // ---- helpers ----

  private async assertParty(userId: string, disputeId: string) {
    const d = await this.prisma.dispute.findFirst({
      where: {
        id: disputeId,
        OR: [{ order: { buyerId: userId } }, { order: { seller: { userId } } }],
      },
      include: { order: { select: { buyerId: true } } },
    });
    if (!d) throw AppException.notFound('Dispute', disputeId);
    return d;
  }

  private serialize(d: any) {
    return {
      id: d.id,
      orderId: d.orderId,
      orderReference: d.order?.reference ?? '',
      status: d.status,
      reason: d.reason,
      description: d.description,
      desiredOutcome: d.desiredOutcome,
      requestedAmount: d.requestedAmount ? new D(d.requestedAmount).toString() : null,
      openedByType: d.openedByType,
      slaDueAt: d.slaDueAt?.toISOString() ?? null,
      resolution: d.resolution
        ? {
            outcome: d.resolution.outcome,
            refundAmount: d.resolution.refundAmount
              ? new D(d.resolution.refundAmount).toString()
              : null,
            rationale: d.resolution.rationale,
            resolvedByAdminId: d.resolution.resolvedByAdminId,
            resolvedAt: d.resolution.createdAt.toISOString(),
          }
        : null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };
  }
}
