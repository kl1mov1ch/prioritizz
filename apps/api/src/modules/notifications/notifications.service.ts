import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bullmq';
import { QUEUES } from '@prioritizz/constants';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_TOKENS } from '../../queue/queue.module';

type Prefs = Record<string, boolean>;

@Injectable()
export class NotificationsService {
  private readonly log = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(QUEUE_TOKENS[QUEUES.NOTIFICATIONS]) private readonly queue: Queue,
  ) {}

  /**
   * Record an in-app notification and, if the user allows it, push a Telegram
   * message via the bot's NOTIFICATIONS queue consumer. `prefKey` maps to a
   * toggle in Settings ("orderUpdates", "chatMessages", "marketing").
   */
  async notify(
    userId: string,
    opts: {
      template: string;
      title: string;
      body: string;
      prefKey?: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, notificationPrefs: true, status: true },
    });
    if (!user || user.status === 'BANNED') return;

    await this.prisma.notification.create({
      data: {
        userId,
        channel: 'IN_APP',
        template: opts.template,
        title: opts.title,
        body: opts.body,
        payload: (opts.payload ?? {}) as never,
      },
    });

    const prefs = (user.notificationPrefs ?? {}) as Prefs;
    const telegramOn = prefs.telegram !== false;
    const catOn = opts.prefKey ? prefs[opts.prefKey] !== false : true;
    if (!telegramOn || !catOn) return;

    try {
      await this.queue.add(
        'notification.send',
        { telegramId: Number(user.telegramId), text: `${opts.title}\n${opts.body}` },
        { removeOnComplete: 500, attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
      );
    } catch (err) {
      this.log.warn(`enqueue notification failed: ${(err as Error).message}`);
    }
  }

  /** Read the caller's recent in-app notifications. */
  async list(userId: string, limit = 30) {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((n) => ({
      id: n.id,
      template: n.template,
      title: n.title,
      body: n.body,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async markAllRead(userId: string) {
    const res = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { read: res.count };
  }
}
