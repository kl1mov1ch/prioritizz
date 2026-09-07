import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Currency } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { OutboxService } from '../../common/outbox/outbox.service';
import { LedgerService } from '../ledger/ledger.service';
import { OrderStateMachine } from '../orders/order.state-machine';

const D = Prisma.Decimal;
const PLATFORM = '';

/**
 * Guarantee mechanics on top of the double-entry ledger.
 *
 *   pay      PSP_CLEARING(platform) -T   →  ESCROW_HOLD(order) +T
 *   release  ESCROW_HOLD(order) -T        →  USER_AVAILABLE(seller) +net
 *                                          +  PLATFORM_REVENUE(platform) +fee
 *   refund   ESCROW_HOLD(order) -amt      →  USER_AVAILABLE(buyer) +amt
 *   split    a refund to the buyer + a release of the remainder to the seller,
 *            with the platform fee prorated to the released share.
 *
 * Every method runs inside the caller's `prisma.$transaction`.
 */
@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly outbox: OutboxService,
    private readonly sm: OrderStateMachine,
  ) {}

  /** Called once payment is captured: money moves into the per-order hold. */
  async hold(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      status: any;
      version: number;
      currency: Currency;
      totalAmount: Prisma.Decimal;
      buyerId: string;
    },
  ): Promise<void> {
    const existing = await tx.escrowCase.findUnique({ where: { orderId: order.id } });
    if (existing) return; // idempotent — a duplicate capture must not double-hold

    const total = new D(order.totalAmount);
    const group = await this.ledger.post(tx, {
      currency: order.currency,
      transactionType: 'CHARGE',
      orderId: order.id,
      memo: `escrow hold ${order.id}`,
      legs: [
        {
          accountType: 'PSP_CLEARING',
          ownerType: 'PLATFORM',
          ownerId: PLATFORM,
          direction: 'DEBIT',
          amount: total,
        },
        {
          accountType: 'ESCROW_HOLD',
          ownerType: 'ORDER',
          ownerId: order.id,
          direction: 'CREDIT',
          amount: total,
        },
      ],
    });

    await tx.escrowCase.create({
      data: {
        orderId: order.id,
        status: 'HELD',
        currency: order.currency,
        heldAmount: total,
      },
    });

    await this.sm.transition(tx, order, 'PAID', {
      actorType: 'SYSTEM',
      message: `ledger:${group}`,
      eventName: DOMAIN_EVENTS.ORDER_PAID,
    });
    await this.sm.transition(
      tx,
      { ...order, status: 'PAID', version: order.version + 1 },
      'IN_ESCROW',
      {
        actorType: 'SYSTEM',
        eventName: DOMAIN_EVENTS.ORDER_ESCROWED,
      },
    );
  }

  /** Full release to the seller. Order → COMPLETED. */
  async release(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      status: any;
      version: number;
      currency: Currency;
      sellerId: string;
      sellerNetAmount: Prisma.Decimal;
      commissionSnapshot: any;
    },
    actor: { type: any; id?: string | null } = { type: 'SYSTEM' },
  ): Promise<void> {
    const esc = await this.loadHeld(tx, order.id);
    const seller = await tx.sellerProfile.findUniqueOrThrow({
      where: { id: order.sellerId },
      select: { userId: true },
    });
    const remaining = new D(esc.heldAmount).sub(esc.releasedAmount).sub(esc.refundedAmount);
    const fee = new D((order.commissionSnapshot?.computedFee as string) ?? '0');
    const net = remaining.sub(fee);
    if (net.lt(0))
      throw new AppException(ERROR_CODES.LEDGER_UNBALANCED, 'commission exceeds escrow');

    const group = await this.ledger.post(tx, {
      currency: order.currency,
      transactionType: 'COMMISSION',
      orderId: order.id,
      memo: `escrow release ${order.id}`,
      legs: [
        {
          accountType: 'ESCROW_HOLD',
          ownerType: 'ORDER',
          ownerId: order.id,
          direction: 'DEBIT',
          amount: remaining,
        },
        {
          accountType: 'USER_AVAILABLE',
          ownerType: 'USER',
          ownerId: seller.userId,
          direction: 'CREDIT',
          amount: net,
        },
        ...(fee.gt(0)
          ? [
              {
                accountType: 'PLATFORM_REVENUE' as const,
                ownerType: 'PLATFORM' as const,
                ownerId: PLATFORM,
                direction: 'CREDIT' as const,
                amount: fee,
              },
            ]
          : []),
      ],
    });

    await tx.escrowCase.update({
      where: { orderId: order.id },
      data: {
        status: 'RELEASED',
        releasedAmount: { increment: remaining },
        version: { increment: 1 },
      },
    });
    await tx.sellerProfile.update({
      where: { id: order.sellerId },
      data: { completedOrders: { increment: 1 } },
    });
    if (order.status !== 'COMPLETED') {
      await this.sm.transition(tx, order, 'COMPLETED', {
        actorType: actor.type,
        actorId: actor.id,
        message: `ledger:${group}`,
        eventName: DOMAIN_EVENTS.ESCROW_RELEASED,
      });
      await tx.order.update({ where: { id: order.id }, data: { completedAt: new Date() } });
    } else {
      await this.outbox.emit(tx, DOMAIN_EVENTS.ESCROW_RELEASED, { orderId: order.id }, actor);
    }
  }

  /** Return `amount` (default: everything left) to the buyer. */
  async refund(
    tx: Prisma.TransactionClient,
    order: {
      id: string;
      status: any;
      version: number;
      currency: Currency;
      buyerId: string;
    },
    amount?: Prisma.Decimal | string,
    actor: { type: any; id?: string | null } = { type: 'SYSTEM' },
  ): Promise<void> {
    const esc = await this.loadHeld(tx, order.id);
    const left = new D(esc.heldAmount).sub(esc.releasedAmount).sub(esc.refundedAmount);
    const amt = amount ? new D(amount) : left;
    if (amt.lte(0) || amt.gt(left)) {
      throw AppException.validation(`refund amount out of range (max ${left.toString()})`);
    }

    const group = await this.ledger.post(tx, {
      currency: order.currency,
      transactionType: 'REFUND',
      orderId: order.id,
      memo: `escrow refund ${order.id}`,
      legs: [
        {
          accountType: 'ESCROW_HOLD',
          ownerType: 'ORDER',
          ownerId: order.id,
          direction: 'DEBIT',
          amount: amt,
        },
        {
          accountType: 'USER_AVAILABLE',
          ownerType: 'USER',
          ownerId: order.buyerId,
          direction: 'CREDIT',
          amount: amt,
        },
      ],
    });

    const fullyDrained = amt.equals(left);
    await tx.escrowCase.update({
      where: { orderId: order.id },
      data: {
        status: fullyDrained ? 'REFUNDED' : 'SPLIT',
        refundedAmount: { increment: amt },
        version: { increment: 1 },
      },
    });
    await tx.order.update({
      where: { id: order.id },
      data: { refundedAmount: { increment: amt } },
    });

    const to = fullyDrained ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
    if (order.status !== to) {
      await this.sm.transition(tx, order, to, {
        actorType: actor.type,
        actorId: actor.id,
        message: `ledger:${group}`,
        eventName: DOMAIN_EVENTS.ESCROW_REFUNDED,
      });
    } else {
      await this.outbox.emit(
        tx,
        DOMAIN_EVENTS.ESCROW_REFUNDED,
        { orderId: order.id, amount: amt.toString() },
        actor,
      );
    }
  }

  private async loadHeld(tx: Prisma.TransactionClient, orderId: string) {
    const esc = await tx.escrowCase.findUnique({ where: { orderId } });
    if (!esc)
      throw new AppException(ERROR_CODES.ESCROW_INVALID_TRANSITION, 'no escrow for this order');
    if (esc.status === 'RELEASED' || esc.status === 'REFUNDED') {
      throw new AppException(ERROR_CODES.ESCROW_INVALID_TRANSITION, `escrow already ${esc.status}`);
    }
    return esc;
  }
}
