import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUES } from '@prioritizz/constants';
import type { ChatListQuery, ChatMessage, OrderMessageInput } from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { MediaService } from '../media/media.service';
import { QUEUE_TOKENS } from '../../queue/queue.module';

type Party = {
  role: 'BUYER' | 'SELLER';
  sellerProfileId: string;
  buyerId: string;
  sellerUserId: string;
};

@Injectable()
export class MessagesService {
  private readonly log = new Logger(MessagesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly media: MediaService,
    @Inject(QUEUE_TOKENS[QUEUES.NOTIFICATIONS]) private readonly notifications: Queue,
  ) {}

  /** Resolves the viewer's side of an order, or 404s (which also covers "not a party"). */
  private async party(userId: string, orderId: string): Promise<Party & { reference: string }> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, OR: [{ buyerId: userId }, { seller: { userId } }] },
      select: {
        reference: true,
        buyerId: true,
        sellerId: true,
        seller: { select: { userId: true } },
      },
    });
    if (!order) throw AppException.notFound('Order', orderId);
    return {
      role: order.buyerId === userId ? 'BUYER' : 'SELLER',
      sellerProfileId: order.sellerId,
      buyerId: order.buyerId,
      sellerUserId: order.seller.userId,
      reference: order.reference,
    };
  }

  async list(userId: string, orderId: string, query: ChatListQuery) {
    const party = await this.party(userId, orderId);

    const where = {
      orderId,
      ...(query.after ? { createdAt: { gt: new Date(query.after) } } : {}),
      ...(query.before ? { id: { lt: query.before } } : {}),
    };

    const rows = await this.prisma.orderMessage.findMany({
      where,
      orderBy: { createdAt: query.before ? 'desc' : 'asc' },
      take: query.limit + 1,
    });

    const hasMore = rows.length > query.limit;
    const page = hasMore ? rows.slice(0, query.limit) : rows;
    // `before` fetches walk backwards; hand them back oldest-first like the rest.
    const ordered = query.before ? page.reverse() : page;

    const attachments = await this.attachmentsByMessage(ordered.map((m) => m.id));

    const unread = await this.prisma.orderMessage.count({
      where: { orderId, readAt: null, authorType: party.role === 'BUYER' ? 'SELLER' : 'BUYER' },
    });

    return {
      items: ordered.map((m) => this.serialize(m, userId, party, attachments.get(m.id) ?? [])),
      unread,
      hasMore,
    };
  }

  async send(userId: string, orderId: string, input: OrderMessageInput): Promise<ChatMessage> {
    const party = await this.party(userId, orderId);

    if (input.attachmentIds.length) {
      await this.media.claim(userId, 'ORDER', orderId, input.attachmentIds);
    }

    const msg = await this.prisma.orderMessage.create({
      data: {
        orderId,
        authorId: userId,
        authorType: party.role,
        body: input.body,
      },
    });

    // Notify the other side via the NOTIFICATIONS queue; the bot process
    // consumes it and pushes a Telegram message. Failure here must not fail
    // the send.
    void this.notifyPeer(party, orderId, input.body).catch((err) =>
      this.log.warn(`chat notification enqueue failed: ${String(err)}`),
    );

    const attachments = await this.attachmentsByMessage([msg.id]);
    return this.serialize(msg, userId, party, attachments.get(msg.id) ?? []);
  }

  /** Marks the peer's messages as read. Returns how many flipped. */
  async markRead(userId: string, orderId: string): Promise<{ read: number }> {
    const party = await this.party(userId, orderId);
    const res = await this.prisma.orderMessage.updateMany({
      where: {
        orderId,
        readAt: null,
        authorType: party.role === 'BUYER' ? 'SELLER' : 'BUYER',
      },
      data: { readAt: new Date() },
    });
    return { read: res.count };
  }

  private async notifyPeer(
    party: Party & { reference: string },
    orderId: string,
    body: string,
  ): Promise<void> {
    const recipientUserId = party.role === 'BUYER' ? party.sellerUserId : party.buyerId;
    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientUserId },
      select: { telegramId: true, notificationPrefs: true },
    });
    if (!recipient) return;
    const prefs = (recipient.notificationPrefs ?? {}) as Record<string, unknown>;
    if (prefs.chatMessages === false || prefs.telegram === false) return;

    const preview = body.length > 160 ? `${body.slice(0, 160)}…` : body;
    await this.notifications.add('notification.send', {
      telegramId: Number(recipient.telegramId),
      text: `💬 New message on order ${party.reference}\n\n${preview}`,
    });
  }

  private async attachmentsByMessage(_ids: string[]) {
    // OrderMessage has no per-message attachment link in the schema; chat
    // attachments hang off the order. Kept as a hook for when that lands.
    return new Map<string, { id: string; url: string; kind: string }[]>();
  }

  private serialize(
    m: {
      id: string;
      orderId: string;
      body: string;
      authorId: string;
      authorType: string;
      readAt: Date | null;
      createdAt: Date;
    },
    viewerId: string,
    _party: Party,
    attachments: { id: string; url: string; kind: string }[],
  ): ChatMessage {
    return {
      id: m.id,
      orderId: m.orderId,
      body: m.body,
      authorId: m.authorId,
      authorType: (m.authorType === 'BUYER' || m.authorType === 'SELLER'
        ? m.authorType
        : 'SYSTEM') as 'BUYER' | 'SELLER' | 'SYSTEM',
      mine: m.authorId === viewerId,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      attachments,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
