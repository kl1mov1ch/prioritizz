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
    try {
      return schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppException.validation('Request validation failed', err.flatten());
      }
      throw err;
    }
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
