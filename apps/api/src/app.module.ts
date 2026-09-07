import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { loadEnv } from '@prioritizz/config';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queue/queue.module';
import { CommonModule } from './common/common.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SellersModule } from './modules/sellers/sellers.module';
import { MediaModule } from './modules/media/media.module';
import { MessagesModule } from './modules/messages/messages.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { CommissionsModule } from './modules/commissions/commissions.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { OrdersCoreModule } from './modules/orders/orders-core.module';
import { OrdersModule } from './modules/orders/orders.module';
import { EscrowModule } from './modules/escrow/escrow.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AdminModule } from './modules/admin/admin.module';
import { WorkersModule } from './workers/workers.module';
import { HealthModule } from './modules/health/health.module';

const env = loadEnv();

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.LOG_LEVEL,
        transport: env.LOG_PRETTY ? { target: 'pino-pretty' } : undefined,
        redact: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["x-telegram-init-data"]',
        ],
        genReqId: (req, res) => {
          const id = (req.headers['x-request-id'] as string) ?? crypto.randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },
      },
    }),
    EventEmitterModule.forRoot({ global: true, wildcard: true, delimiter: '.' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    PrismaModule,
    RedisModule,
    QueueModule,
    CommonModule,

    AuthModule,
    UsersModule,
    SellersModule,
    MediaModule,
    CatalogModule,
    CommissionsModule,
    LedgerModule,
    OrdersCoreModule,
    EscrowModule,
    OrdersModule,
    PaymentsModule,
    DisputesModule,
    PayoutsModule,
    NotificationsModule,
    MessagesModule,
    ReviewsModule,
    AdminModule,
    WorkersModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
