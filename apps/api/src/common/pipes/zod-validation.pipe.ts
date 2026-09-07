import { Injectable, PipeTransform, type ArgumentMetadata } from '@nestjs/common';
import { ZodSchema, ZodError } from 'zod';
import { AppException } from '../errors/app-exception';

const SCHEMA_KEY = 'zod:schema';

/** Attach a Zod schema to a DTO class / param via @UseZod(schema). */
export function UseZod(schema: ZodSchema) {
  return (target: object, propertyKey?: string | symbol, parameterIndex?: number) => {
    const key = parameterIndex != null ? `${SCHEMA_KEY}:${parameterIndex}` : SCHEMA_KEY;
    Reflect.defineMetadata(key, schema, target, propertyKey ?? '');
  };
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema: ZodSchema | undefined = (metadata.metatype as any)?.[SCHEMA_KEY];
    if (!schema) return value;
    const result = schema.safeParse(value);
    if (result.success) return result.data;
    // Duck-typed, not `instanceof`: a ZodEffects (.refine/.superRefine/.transform)
    // schema can surface a ZodError constructed by a differently-resolved copy
    // of zod, and instanceof would miss it — turning a 422 into a 500.
    const err = result.error;
    const flatten =
      typeof (err as ZodError)?.flatten === 'function'
        ? (err as ZodError).flatten()
        : { formErrors: [String(err)], fieldErrors: {} };
    throw AppException.validation('Request validation failed', flatten);
  }
}

/** Standalone helper for use inside services / controllers. */
export function parseWith<T>(schema: ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw AppException.validation('Validation failed', result.error.flatten());
  }
  return result.data;
}
