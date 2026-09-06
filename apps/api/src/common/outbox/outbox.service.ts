import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { DomainEventName } from '@prioritizz/constants';
import type { ActorType } from '@prisma/client';

/**
 * Transactional outbox. Domain services call `emit()` INSIDE their $transaction
 * so an event is persisted atomically with the state change. A background
 * processor (OUTBOX_DISPATCH queue) later publishes PENDING rows to the bus.
 */
@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async emit(
    tx: Prisma.TransactionClient,
    name: DomainEventName,
    payload: Record<string, unknown>,
    actor: { type: ActorType; id?: string | null } = { type: 'SYSTEM' },
  ): Promise<void> {
    await tx.outboxEvent.create({
      data: {
        name,
        payload: payload as Prisma.InputJsonValue,
        actorType: actor.type,
        actorId: actor.id ?? null,
      },
    });
  }
}
