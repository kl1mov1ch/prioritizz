import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Transactional-outbox pump. Services write OutboxEvent rows inside their
 * $transaction (so an event is never lost or emitted for a rolled-back change);
 * this polls the PENDING rows and re-emits them onto the in-process bus, where
 * NotificationsListener and others pick them up. Marks each DISPATCHED so it
 * fires exactly once even across API restarts.
 */
@Injectable()
export class OutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger(OutboxDispatcher.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventEmitter2,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), 3000);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const batch = await this.prisma.outboxEvent.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'asc' },
        take: 50,
      });
      for (const row of batch) {
        try {
          await this.events.emitAsync(row.name, {
            id: row.id,
            name: row.name,
            payload: row.payload,
            actor: { type: row.actorType, id: row.actorId },
            occurredAt: row.createdAt.toISOString(),
          });
          await this.prisma.outboxEvent.update({
            where: { id: row.id },
            data: { status: 'DISPATCHED', dispatchedAt: new Date(), attempts: { increment: 1 } },
          });
        } catch (err) {
          this.log.warn(`outbox ${row.name} (${row.id}) failed: ${(err as Error).message}`);
          await this.prisma.outboxEvent.update({
            where: { id: row.id },
            data: {
              attempts: { increment: 1 },
              status: row.attempts >= 9 ? 'FAILED' : 'PENDING',
            },
          });
        }
      }
    } catch (err) {
      this.log.error(`outbox tick: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
