import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DOMAIN_EVENTS } from '@prioritizz/constants';
import { PrismaService } from '../prisma/prisma.service';
import { EscrowService } from '../modules/escrow/escrow.service';

/**
 * Time-driven escrow transitions. Runs on a 60 s poll (no external scheduler):
 *   · DELIVERED past `autoReleaseAt` with no open dispute → release to seller
 *   · PENDING_PAYMENT past `paymentExpiresAt` → EXPIRED
 *
 * Idempotent — each pass re-reads state inside its own transaction.
 */
@Injectable()
export class EscrowTimersWorker implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(EscrowTimersWorker.name);
  private timer?: NodeJS.Timeout;
  private busy = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), 60_000);
    setTimeout(() => void this.tick(), 8_000); // one early pass after boot
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.busy) return;
    this.busy = true;
    try {
      await this.autoRelease();
      await this.expirePayments();
    } catch (err) {
      this.log.error(`tick failed: ${(err as Error).message}`);
    } finally {
      this.busy = false;
    }
  }

  private async autoRelease() {
    const due = await this.prisma.order.findMany({
      where: {
        status: 'DELIVERED',
        autoReleaseAt: { lte: new Date() },
        dispute: null,
      },
      take: 25,
    });
    for (const order of due) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const fresh = await tx.order.findUnique({ where: { id: order.id } });
          if (!fresh || fresh.status !== 'DELIVERED') return;
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
            { type: 'SYSTEM', id: null },
          );
        });
        this.log.log(`auto-released ${order.reference}`);
      } catch (err) {
        this.log.warn(`auto-release ${order.reference}: ${(err as Error).message}`);
      }
    }
  }

  private async expirePayments() {
    const stale = await this.prisma.order.findMany({
      where: { status: 'PENDING_PAYMENT', paymentExpiresAt: { lte: new Date() } },
      take: 50,
    });
    for (const order of stale) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const fresh = await tx.order.findUnique({ where: { id: order.id } });
          if (!fresh || fresh.status !== 'PENDING_PAYMENT') return;
          await tx.order.updateMany({
            where: { id: fresh.id, version: fresh.version },
            data: { status: 'EXPIRED', version: { increment: 1 }, canceledAt: new Date() },
          });
          await tx.orderEvent.create({
            data: {
              orderId: fresh.id,
              type: 'status.changed',
              fromStatus: 'PENDING_PAYMENT',
              toStatus: 'EXPIRED',
              actorType: 'SYSTEM',
              message: 'payment window elapsed',
            },
          });
          await tx.paymentIntent.updateMany({
            where: { orderId: fresh.id, status: 'REQUIRES_PAYMENT' },
            data: { status: 'CANCELED' },
          });
          await tx.outboxEvent.create({
            data: {
              name: DOMAIN_EVENTS.ORDER_EXPIRED,
              payload: { orderId: fresh.id },
              actorType: 'SYSTEM',
            },
          });
        });
      } catch (err) {
        this.log.warn(`expire ${order.reference}: ${(err as Error).message}`);
      }
    }
  }
}
