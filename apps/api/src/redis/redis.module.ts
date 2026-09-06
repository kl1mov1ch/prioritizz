import { Global, Module } from '@nestjs/common';
import IORedis from 'ioredis';
import { loadEnv } from '@prioritizz/config';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: () => {
        const env = loadEnv();
        return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: false });
      },
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
