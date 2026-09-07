import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { loadEnv } from '@prioritizz/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';
import { AuditService } from './audit/audit.service';
import { OutboxService } from './outbox/outbox.service';
import { OutboxDispatcher } from './outbox/outbox-dispatcher';

const env = loadEnv();

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: env.JWT_ACCESS_TTL },
    }),
  ],
  providers: [
    AuditService,
    OutboxService,
    OutboxDispatcher,
    IdempotencyInterceptor,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [JwtModule, AuditService, OutboxService, IdempotencyInterceptor],
})
export class CommonModule {}
