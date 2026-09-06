import { HttpException } from '@nestjs/common';
import { ERROR_CODES, HTTP_STATUS_BY_CODE, type ErrorCode } from '@prioritizz/constants';

/**
 * The only exception type domain code should throw. Maps a stable ErrorCode to
 * an HTTP status and a machine-readable body: { code, message, details? }.
 */
export class AppException extends HttpException {
  constructor(
    readonly code: ErrorCode,
    message?: string,
    readonly details?: unknown,
    statusOverride?: number,
  ) {
    const status = statusOverride ?? HTTP_STATUS_BY_CODE[code] ?? 400;
    super({ code, message: message ?? code, details }, status);
  }

  static notFound(entity: string, id?: string) {
    return new AppException(ERROR_CODES.NOT_FOUND, `${entity}${id ? ` ${id}` : ''} not found`);
  }

  static forbidden(message = 'Forbidden') {
    return new AppException(ERROR_CODES.AUTH_FORBIDDEN_ROLE, message);
  }

  static conflict(message: string, details?: unknown) {
    return new AppException(ERROR_CODES.CONFLICT, message, details);
  }

  static validation(message: string, details?: unknown) {
    return new AppException(ERROR_CODES.VALIDATION_FAILED, message, details);
  }

  static invalidTransition(code: ErrorCode, from: string, to: string) {
    return new AppException(code, `Illegal transition ${from} -> ${to}`, { from, to });
  }
}
