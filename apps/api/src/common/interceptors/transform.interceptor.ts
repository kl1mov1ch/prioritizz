import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Serialises BigInt and Prisma.Decimal to JSON-safe strings so money never
 * degrades to a float on the wire. Responses are returned as-is otherwise.
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((data) => normalize(data)));
  }
}

function normalize(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    const anyVal = value as any;
    // Prisma.Decimal instances expose toFixed / toString
    if (typeof anyVal.toFixed === 'function' && typeof anyVal.d !== 'undefined') {
      return anyVal.toString();
    }
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(normalize);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = normalize(v);
    return out;
  }
  return value;
}
