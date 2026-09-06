import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createHash } from 'node:crypto';
import type { Request } from 'express';
import { Observable, from, of, switchMap, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../errors/app-exception';
import { ERROR_CODES } from '@prioritizz/constants';

export const IDEMPOTENT_KEY = 'idempotent:scope';
/** Mark a mutating handler as requiring an Idempotency-Key header. */
export const Idempotent = (scope: string) => SetMetadata(IDEMPOTENT_KEY, scope);

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const scope = this.reflector.get<string>(IDEMPOTENT_KEY, ctx.getHandler());
    if (!scope) return next.handle();

    const req = ctx.switchToHttp().getRequest<Request>();
    const key = req.header('idempotency-key');
    if (!key) {
      throw AppException.validation('Idempotency-Key header is required for this operation');
    }

    const requestHash = createHash('sha256')
      .update(JSON.stringify({ body: req.body, params: req.params, query: req.query }))
      .digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 3600 * 1000);

    return from(
      this.prisma.idempotencyKey.findUnique({ where: { scope_key: { scope, key } } }),
    ).pipe(
      switchMap((existing) => {
        if (existing) {
          if (existing.requestHash !== requestHash) {
            throw new AppException(
              ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
              'Idempotency-Key reused with a different payload',
            );
          }
          if (existing.completedAt && existing.responseBody != null) {
            return of(existing.responseBody);
          }
          // in-flight duplicate
          throw new AppException(ERROR_CODES.CONFLICT, 'Duplicate request in progress');
        }

        return from(
          this.prisma.idempotencyKey.create({
            data: { scope, key, requestHash, expiresAt },
          }),
        ).pipe(
          switchMap(() =>
            next.handle().pipe(
              tap({
                next: (body) =>
                  void this.prisma.idempotencyKey.update({
                    where: { scope_key: { scope, key } },
                    data: { completedAt: new Date(), responseBody: body as any, responseCode: 200 },
                  }),
                error: () =>
                  void this.prisma.idempotencyKey.delete({
                    where: { scope_key: { scope, key } },
                  }),
              }),
            ),
          ),
        );
      }),
    );
  }
}
