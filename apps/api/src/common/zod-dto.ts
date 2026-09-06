import { z, type ZodSchema } from 'zod';
import { AppException } from './errors/app-exception';

/**
 * Bridges a Zod schema into a Nest DTO class. The generated class carries the
 * schema on a static key that ZodValidationPipe reads. Keeps ONE source of
 * truth (packages/schemas) for request contracts across FE and BE.
 */
export function createZodDto<T extends ZodSchema>(schema: T) {
  class ZodDto {
    static readonly ['zod:schema'] = schema;
    static parse(input: unknown): z.infer<T> {
      const r = schema.safeParse(input);
      if (!r.success) throw AppException.validation('Validation failed', r.error.flatten());
      return r.data;
    }
  }
  return ZodDto as unknown as {
    new (): z.infer<T>;
    ['zod:schema']: T;
    parse(input: unknown): z.infer<T>;
  };
}
