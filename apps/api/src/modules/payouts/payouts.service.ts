import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'node:crypto';
import {
  DOMAIN_EVENTS,
  ERROR_CODES,
  PAYOUT_TRANSITIONS,
  canTransition,
} from '@prioritizz/constants';
import { loadEnv } from '@prioritizz/config';
import type { AdminPayoutDecisionInput, RequestPayoutInput } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { OutboxService } from '../../common/outbox/outbox.service';
import { LedgerService } from '../ledger/ledger.service';

const D = Prisma.Decimal;
const PLATFORM = '';
const MIN_PAYOUT = new D(10);

@Injectable()
export class PayoutsService {
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly outbox: OutboxService,
  ) {}

  /** Seller requests a withdrawal from their available balance. */
  async request(userId: string, input: RequestPayoutInput) {
    return this.prisma.$transaction(async (tx) => {
      const seller = await tx.sellerProfile.findUnique({ where: { userId }, select: { id: true } });
      if (!seller) throw AppException.forbidden('Seller profile required');

      const amt = new D(input.amount);
      if (amt.lt(MIN_PAYOUT)) {
        throw new AppException(ERROR_CODES.PAYOUT_BELOW_MINIMUM, `minimum payout is ${MIN_PAYOUT}`);
      }

      const balance = new D(
        await this.ledger.balance('USER', userId, input.currency, 'USER_AVAILABLE'),
      );
      const pendingOut = await tx.payout.aggregate({
        where: { sellerId: seller.id, status: { in: ['REQUESTED', 'APPROVED', 'PROCESSING'] } },
        _sum: { amount: true },
      });
      const locked = new D(pendingOut._sum.amount ?? 0);
      if (amt.gt(balance.sub(locked))) {
        throw new AppException(
          ERROR_CODES.INSUFFICIENT_BALANCE,
          `available ${balance.sub(locked).toString()} ${input.currency}`,
        );
      }

      const feeAmount = new D(0); // platform eats the payout fee for now
      const payout = await tx.payout.create({
        data: {
          reference: `PO-${ref()}`,
          sellerId: seller.id,
          currency: input.currency,
          amount: amt,
          feeAmount,
          netAmount: amt.sub(feeAmount),
          status: 'REQUESTED',
          method: input.method as Prisma.InputJsonValue,
        },
      });
      await this.outbox.emit(tx, DOMAIN_EVENTS.PAYOUT_REQUESTED, {
        payoutId: payout.id,
        sellerId: seller.id,
        amount: amt.toString(),
      });
      return this.serialize(payout);
    });
  }

  async listMine(userId: string, query: { page: number; pageSize: number; status?: string }) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!seller) return { items: [], page: 1, pageSize: query.pageSize, total: 0, totalPages: 0 };
    return this.page(
      { sellerId: seller.id, status: query.status as any },
      query.page,
      query.pageSize,
    );
  }

  // ---- admin ----

  async adminList(query: { page: number; pageSize: number; status?: string; sellerId?: string }) {
    return this.page(
      { status: query.status as any, sellerId: query.sellerId },
      query.page,
      query.pageSize,
      true,
    );
  }

  async decide(adminUserId: string, payoutId: string, input: AdminPayoutDecisionInput) {
    return this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({
        where: { id: payoutId },
        include: { seller: { select: { userId: true } } },
      });
      if (!payout) throw AppException.notFound('Payout', payoutId);
      if (payout.status !== 'REQUESTED') {
        throw new AppException(ERROR_CODES.PAYOUT_INVALID_TRANSITION, `payout is ${payout.status}`);
      }
      const admin = await tx.adminUser.findUnique({ where: { userId: adminUserId } });

      if (input.decision === 'REJECT') {
        this.assertTransition(payout.status, 'REJECTED');
        const updated = await tx.payout.update({
          where: { id: payoutId },
          data: {
            status: 'REJECTED',
            failureReason: input.note ?? 'rejected by admin',
            approvedByAdminId: admin?.id ?? null,
            version: { increment: 1 },
          },
        });
        return this.serialize(updated);
      }

      // APPROVE → debit the seller's available balance and mark PAID.
      this.assertTransition(payout.status, 'APPROVED');
      const group = await this.ledger.post(tx, {
        currency: payout.currency,
        transactionType: 'PAYOUT',
        memo: `payout ${payout.reference}`,
        legs: [
          {
            accountType: 'USER_AVAILABLE',
            ownerType: 'USER',
            ownerId: payout.seller.userId,
            direction: 'DEBIT',
            amount: payout.amount,
          },
          {
            accountType: 'PSP_CLEARING',
            ownerType: 'PLATFORM',
            ownerId: PLATFORM,
            direction: 'CREDIT',
            amount: payout.amount,
          },
        ],
      });
      await tx.transaction.create({
        data: {
          type: 'PAYOUT',
          status: 'SUCCEEDED',
          provider: 'manual',
          providerRef: payout.reference,
          currency: payout.currency,
          amount: payout.amount,
          feeAmount: payout.feeAmount,
          ledgerGroupId: group,
        },
      });
      const updated = await tx.payout.update({
        where: { id: payoutId },
        data: {
          status: 'PAID',
          approvedByAdminId: admin?.id ?? null,
          ledgerGroupId: group,
          processedAt: new Date(),
          version: { increment: 1 },
        },
      });
      await this.outbox.emit(tx, DOMAIN_EVENTS.PAYOUT_PAID, {
        payoutId,
        sellerId: payout.sellerId,
        amount: payout.amount.toString(),
      });
      return this.serialize(updated);
    });
  }

  // ---- helpers ----

  private assertTransition(from: string, to: string) {
    if (!canTransition(PAYOUT_TRANSITIONS as any, from as any, to as any)) {
      throw AppException.invalidTransition(ERROR_CODES.PAYOUT_INVALID_TRANSITION, from, to);
    }
  }

  private async page(
    where: Prisma.PayoutWhereInput,
    pageNum: number,
    pageSize: number,
    withSeller = false,
  ) {
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.payout.count({ where }),
      this.prisma.payout.findMany({
        where,
        include: withSeller ? { seller: { select: { displayName: true } } } : undefined,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSize,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((p) => this.serialize(p)),
      page: pageNum,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  private serialize(p: any) {
    return {
      id: p.id,
      reference: p.reference,
      sellerId: p.sellerId,
      sellerName: p.seller?.displayName,
      amount: new D(p.amount).toString(),
      currency: p.currency,
      feeAmount: new D(p.feeAmount).toString(),
      netAmount: new D(p.netAmount).toString(),
      status: p.status,
      method: p.method,
      providerRef: p.providerRef,
      failureReason: p.failureReason,
      approvedByAdminId: p.approvedByAdminId,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

function ref(): string {
  const CH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (const b of randomBytes(7)) s += CH[b % CH.length];
  return s;
}
