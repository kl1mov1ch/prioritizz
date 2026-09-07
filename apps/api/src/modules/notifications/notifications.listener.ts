import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DOMAIN_EVENTS } from '@prioritizz/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

interface Envelope {
  payload: Record<string, unknown>;
  actor: { type: string; id: string | null };
}

/**
 * Turns domain events (drained from the outbox) into user-facing notifications.
 * Every handler resolves the two order parties and messages the one who didn't
 * trigger the event.
 */
@Injectable()
export class NotificationsListener {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notify: NotificationsService,
  ) {}

  private async order(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        reference: true,
        buyerId: true,
        seller: { select: { userId: true } },
        service: { select: { title: true } },
      },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ORDER_PAID)
  async onPaid(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    await this.notify.notify(o.seller.userId, {
      template: 'order.paid',
      title: `💰 Оплачен заказ ${o.reference}`,
      body: `«${o.service.title}» — деньги в escrow. Приступайте к выполнению.`,
      prefKey: 'orderUpdates',
      payload: { orderId: e.payload.orderId },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ORDER_DELIVERED)
  async onDelivered(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    await this.notify.notify(o.buyerId, {
      template: 'order.delivered',
      title: `📦 Заказ ${o.reference} выполнен`,
      body: `Проверьте результат и подтвердите получение — иначе средства уйдут продавцу автоматически.`,
      prefKey: 'orderUpdates',
      payload: { orderId: e.payload.orderId },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ESCROW_RELEASED)
  async onReleased(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    await this.notify.notify(o.seller.userId, {
      template: 'escrow.released',
      title: `✅ Средства по заказу ${o.reference} зачислены`,
      body: `Баланс пополнен. Вывод — в разделе «Профиль».`,
      prefKey: 'orderUpdates',
      payload: { orderId: e.payload.orderId },
    });
  }

  @OnEvent(DOMAIN_EVENTS.ESCROW_REFUNDED)
  async onRefunded(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    await this.notify.notify(o.buyerId, {
      template: 'escrow.refunded',
      title: `↩️ Возврат по заказу ${o.reference}`,
      body: `Средства возвращены на ваш баланс.`,
      prefKey: 'orderUpdates',
      payload: e.payload,
    });
  }

  @OnEvent(DOMAIN_EVENTS.DISPUTE_OPENED)
  async onDisputeOpened(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    const openedBy = e.actor.id;
    const target = openedBy === o.buyerId ? o.seller.userId : o.buyerId;
    await this.notify.notify(target, {
      template: 'dispute.opened',
      title: `⚠️ Открыт спор по заказу ${o.reference}`,
      body: `Ответьте в споре — иначе решение примет модератор.`,
      prefKey: 'orderUpdates',
      payload: e.payload,
    });
  }

  @OnEvent(DOMAIN_EVENTS.DISPUTE_RESOLVED)
  async onDisputeResolved(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    const text = `Решение: ${String(e.payload.outcome)}.`;
    for (const uid of [o.buyerId, o.seller.userId]) {
      await this.notify.notify(uid, {
        template: 'dispute.resolved',
        title: `🧑‍⚖️ Спор по заказу ${o.reference} закрыт`,
        body: text,
        prefKey: 'orderUpdates',
        payload: e.payload,
      });
    }
  }

  @OnEvent(DOMAIN_EVENTS.ORDER_MESSAGE_POSTED)
  async onMessage(e: Envelope) {
    const o = await this.order(e.payload.orderId as string);
    if (!o) return;
    const from = e.actor.id;
    const target = from === o.buyerId ? o.seller.userId : o.buyerId;
    await this.notify.notify(target, {
      template: 'order.message',
      title: `💬 Новое сообщение по заказу ${o.reference}`,
      body: String(e.payload.preview ?? 'Откройте чат заказа.'),
      prefKey: 'chatMessages',
      payload: { orderId: e.payload.orderId },
    });
  }

  @OnEvent(DOMAIN_EVENTS.PAYOUT_PAID)
  async onPayoutPaid(e: Envelope) {
    const seller = await this.prisma.sellerProfile.findUnique({
      where: { id: e.payload.sellerId as string },
      select: { userId: true },
    });
    if (!seller) return;
    await this.notify.notify(seller.userId, {
      template: 'payout.paid',
      title: `🏦 Выплата отправлена`,
      body: `${String(e.payload.amount)} — статус можно посмотреть в «Профиль → Выплаты».`,
      prefKey: 'orderUpdates',
      payload: e.payload,
    });
  }
}
