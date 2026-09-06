import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ERROR_CODES } from '@prioritizz/constants';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const traceId = (req.headers['x-request-id'] as string) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: { code: string; message: string; details?: unknown; traceId?: string } = {
      code: ERROR_CODES.INTERNAL,
      message: 'Internal server error',
      traceId,
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resp = exception.getResponse();
      if (typeof resp === 'string') {
        body = { code: ERROR_CODES.INTERNAL, message: resp, traceId };
      } else {
        const r = resp as Record<string, unknown>;
        body = {
          code: (r.code as string) ?? mapHttpStatusToCode(status),
          message:
            (r.message as string) ??
            (Array.isArray(r.message) ? (r.message as string[]).join('; ') : 'Error'),
          details: r.details ?? (Array.isArray(r.message) ? r.message : undefined),
          traceId,
        };
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        body = { code: ERROR_CODES.NOT_FOUND, message: 'Resource not found', traceId };
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        body = {
          code: ERROR_CODES.CONFLICT,
          message: 'Unique constraint violation',
          details: exception.meta,
          traceId,
        };
      } else {
        status = HttpStatus.BAD_REQUEST;
        body = {
          code: ERROR_CODES.VALIDATION_FAILED,
          message: `DB error ${exception.code}`,
          traceId,
        };
      }
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, path: req.url, method: req.method, traceId },
        'Unhandled exception',
      );
    }

    res.status(status).json(body);
  }
}

function mapHttpStatusToCode(status: number): string {
  switch (status) {
    case 401:
      return ERROR_CODES.AUTH_TOKEN_INVALID;
    case 403:
      return ERROR_CODES.AUTH_FORBIDDEN_ROLE;
    case 404:
      return ERROR_CODES.NOT_FOUND;
    case 409:
      return ERROR_CODES.CONFLICT;
    case 422:
      return ERROR_CODES.VALIDATION_FAILED;
    case 429:
      return ERROR_CODES.RATE_LIMITED;
    default:
      return ERROR_CODES.INTERNAL;
  }
}
