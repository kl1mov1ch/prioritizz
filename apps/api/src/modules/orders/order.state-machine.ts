import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { OrderStatus, ActorType } from '@prisma/client';
import {
  ERROR_CODES,
  ORDER_TRANSITIONS,
  canTransition,
} from '@prioritizz/constants';
import { AppException } from '../../common/errors/app-exception';
import { OutboxService } from '../../common/outbox/outbox.service';

export interface TransitionMeta {
  actorType: ActorType;
  actorId?: string | null;
  message?: string;
  eventName?: string;
  eventPayload?: Record<string, unknown>;
}

/**
 * The ONLY place Order.status is allowed to change. Validates the transition
 * against ORDER_TRANSITIONS, applies an optimistic-lock bump, appends an
 * OrderEvent and (optionally) an outbox domain event — all inside the caller's
 * transaction.
 */
@Injectable()
export class OrderStateMachine {
  constructor(private readonly outbox: OutboxService) {}

  async transition(
    tx: Prisma.TransactionClient,
    order: { id: string; status: OrderStatus; version: number },
    to: OrderStatus,
    meta: TransitionMeta,
  ): Promise<void> {
    if (order.status === to) return;
    if (!canTransition(ORDER_TRANSITIONS, order.status, to)) {
      throw AppException.invalidTransition(
        ERROR_CODES.ORDER_INVALID_TRANSITION,
        order.status,
        to,
      );
    }

    const res = await tx.order.updateMany({
      where: { id: order.id, version: order.version },
      data: { status: to, version: { increment: 1 }, updatedAt: new Date() },
    });
    if (res.count === 0) {
      throw new AppException(ERROR_CODES.OPTIMISTIC_LOCK, 'Order changed concurrently; retry');
    }

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: 'status.changed',
        fromStatus: order.status,
        toStatus: to,
        actorType: meta.actorType,
        actorId: meta.actorId ?? null,
        message: meta.message ?? null,
      },
    });

    if (meta.eventName) {
      await this.outbox.emit(
        tx,
        meta.eventName as any,
        { orderId: order.id, from: order.status, to, ...meta.eventPayload },
        { type: meta.actorType, id: meta.actorId },
      );
    }
  }
}
