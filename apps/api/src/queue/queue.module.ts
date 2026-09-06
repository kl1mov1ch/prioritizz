import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUES, type QueueName } from '@prioritizz/constants';
import { loadEnv } from '@prioritizz/config';

export const QUEUE_TOKENS: Record<QueueName, string> = Object.fromEntries(
  Object.values(QUEUES).map((q) => [q, `QUEUE_${q}`]),
) as Record<QueueName, string>;

const env = loadEnv();

const queueProviders = Object.values(QUEUES).map((name) => ({
  provide: QUEUE_TOKENS[name],
  useFactory: () =>
    new Queue(name, {
      connection: new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null }),
      prefix: env.BULLMQ_PREFIX,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 5000,
      },
    }),
}));

@Global()
@Module({
  providers: queueProviders,
  exports: queueProviders.map((p) => p.provide),
})
export class QueueModule implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    // BullMQ queues close their own connections on process exit.
  }
}
