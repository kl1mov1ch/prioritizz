import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DOMAIN_EVENTS, ERROR_CODES } from '@prioritizz/constants';
import { loadEnv } from '@prioritizz/config';
import type { CreatePaymentIntentInput } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { OutboxService } from '../../common/outbox/outbox.service';
import { EscrowService } from '../escrow/escrow.service';

const D = Prisma.Decimal;

@Injectable()
export class PaymentsService {
  private readonly log = new Logger(PaymentsService.name);
  private readonly env = loadEnv();

  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
    private readonly outbox: OutboxService,
  ) {}

  private get providers(): string[] {
    // `mock` is always available outside production so a tester can pay in one click.
    const base = [...this.env.PAYMENT_PROVIDERS];
    if (this.env.NODE_ENV !== 'production' && !base.includes('mock')) base.push('mock');
    return base;
  }

  async createIntent(userId: string, input: CreatePaymentIntentInput) {
    if (!this.providers.includes(input.provider)) {
      throw new AppException(
        ERROR_CODES.PAYMENT_PROVIDER_UNKNOWN,
        `provider "${input.provider}" not enabled`,
      );
    }
    const order = await this.prisma.order.findFirst({
      where: { id: input.orderId, buyerId: userId },
      include: { service: { select: { title: true } } },
    });
    if (!order) throw AppException.notFound('Order', input.orderId);
    if (order.status !== 'PENDING_PAYMENT' || order.paymentStatus === 'SUCCEEDED') {
      throw new AppException(ERROR_CODES.ORDER_NOT_PAYABLE, `order is ${order.status}`);
    }

    // Reuse an open intent for the same provider instead of stacking them.
    const open = await this.prisma.paymentIntent.findFirst({
      where: { orderId: order.id, provider: input.provider, status: 'REQUIRES_PAYMENT' },
    });
    const intent =
      open ??
      (await this.prisma.paymentIntent.create({
        data: {
          orderId: order.id,
          provider: input.provider,
          status: 'REQUIRES_PAYMENT',
          currency: order.currency,
          amount: order.totalAmount,
          expiresAt: order.paymentExpiresAt,
        },
      }));

    if (input.provider === 'mock') {
      await this.capture(intent.id, `mock_${intent.id}`, { provider: 'mock' });
      return this.serialize(
        await this.prisma.paymentIntent.findUniqueOrThrow({ where: { id: intent.id } }),
      );
    }

    if (input.provider === 'telegram_stars') {
      const link = await this.createStarsInvoiceLink({
        payload: intent.id,
        title: order.service.title.slice(0, 32),
        description: `Order ${order.reference}`,
        stars: Math.max(1, Math.round(Number(order.totalAmount))),
      });
      const updated = await this.prisma.paymentIntent.update({
        where: { id: intent.id },
        data: { clientSecret: link, providerPayload: { invoiceLink: link } },
      });
      return this.serialize(updated);
    }

    throw new AppException(ERROR_CODES.PAYMENT_PROVIDER_UNKNOWN, input.provider);
  }

  async getIntent(userId: string, id: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id, order: { buyerId: userId } },
    });
    if (!intent) throw AppException.notFound('PaymentIntent', id);
    return this.serialize(intent);
  }

  /**
   * Marks an intent paid and drops the funds into escrow. Idempotent on
   * (provider, providerRef) via the Transaction unique index.
   */
  async capture(intentId: string, providerRef: string, rawEvent: Record<string, unknown>) {
    return this.prisma.$transaction(async (tx) => {
      const intent = await tx.paymentIntent.findUnique({ where: { id: intentId } });
      if (!intent) throw AppException.notFound('PaymentIntent', intentId);

      const dup = await tx.transaction.findFirst({
        where: { provider: intent.provider, providerRef, type: 'CHARGE' },
      });
      if (dup) return { ok: true, deduped: true };

      const order = await tx.order.findUniqueOrThrow({ where: { id: intent.orderId } });
      if (order.paymentStatus === 'SUCCEEDED') return { ok: true, deduped: true };

      await tx.paymentIntent.update({
        where: { id: intent.id },
        data: { status: 'SUCCEEDED', providerRef },
      });
      await tx.transaction.create({
        data: {
          type: 'CHARGE',
          status: 'SUCCEEDED',
          orderId: order.id,
          paymentIntentId: intent.id,
          provider: intent.provider,
          providerRef,
          currency: intent.currency,
          amount: intent.amount,
          rawEvent: rawEvent as Prisma.InputJsonValue,
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'SUCCEEDED' },
      });

      await this.escrow.hold(tx, {
        id: order.id,
        status: order.status,
        version: order.version,
        currency: order.currency,
        totalAmount: order.totalAmount,
        buyerId: order.buyerId,
      });

      await this.outbox.emit(tx, DOMAIN_EVENTS.PAYMENT_SUCCEEDED, {
        orderId: order.id,
        intentId: intent.id,
        amount: intent.amount.toString(),
      });
      return { ok: true };
    });
  }

  // ---- Telegram Stars ----

  private async createStarsInvoiceLink(p: {
    payload: string;
    title: string;
    description: string;
    stars: number;
  }): Promise<string> {
    const root = this.env.TELEGRAM_API_ROOT?.replace(/\/+$/, '') ?? 'https://api.telegram.org';
    const res = await fetch(
      `${root}/bot${this.env.TELEGRAM_BOT_TOKEN}/createInvoiceLink`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title: p.title,
          description: p.description,
          payload: p.payload,
          provider_token: '', // empty = Telegram Stars
          currency: 'XTR',
          prices: [{ label: p.title, amount: p.stars }],
        }),
      },
    );
    const json = (await res.json()) as { ok: boolean; result?: string; description?: string };
    if (!json.ok || !json.result) {
      this.log.error(`createInvoiceLink failed: ${json.description}`);
      throw new AppException(
        ERROR_CODES.PAYMENT_PROVIDER_ERROR,
        json.description ?? 'invoice link failed',
      );
    }
    return json.result;
  }

  private serialize(i: Prisma.PaymentIntentGetPayload<object>) {
    return {
      id: i.id,
      orderId: i.orderId,
      provider: i.provider,
      status: i.status,
      amount: new D(i.amount).toString(),
      currency: i.currency,
      clientSecret: i.clientSecret,
      providerPayload: (i.providerPayload as Record<string, unknown> | null) ?? null,
      expiresAt: i.expiresAt?.toISOString() ?? null,
    };
  }
}
