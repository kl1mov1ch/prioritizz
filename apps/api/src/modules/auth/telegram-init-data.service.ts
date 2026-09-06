import { Injectable } from '@nestjs/common';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { loadEnv } from '@prioritizz/config';
import { ERROR_CODES } from '@prioritizz/constants';
import type { ParsedInitData, TelegramUser } from '@prioritizz/types';
import { AppException } from '../../common/errors/app-exception';

/**
 * Verifies Telegram WebApp `initData` per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 *   secret_key      = HMAC_SHA256(key="WebAppData", data=bot_token)
 *   data_check_str  = "\n".join(sorted "key=value" for all fields except `hash`)
 *   expected_hash   = HEX(HMAC_SHA256(key=secret_key, data=data_check_str))
 *   valid           = expected_hash === hash  &&  now - auth_date <= maxAge
 */
@Injectable()
export class TelegramInitDataService {
  private readonly env = loadEnv();
  private readonly secretKey = createHmac('sha256', 'WebAppData')
    .update(this.env.TELEGRAM_BOT_TOKEN)
    .digest();

  verify(initData: string): ParsedInitData {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'initData is missing hash');
    }
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const expected = createHmac('sha256', this.secretKey).update(dataCheckString).digest('hex');

    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(hash, 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'initData signature mismatch');
    }

    const authDate = Number(params.get('auth_date'));
    if (!Number.isFinite(authDate)) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'initData is missing auth_date');
    }
    const ageSec = Math.floor(Date.now() / 1000) - authDate;
    if (ageSec > this.env.INITDATA_MAX_AGE_SEC) {
      throw new AppException(
        ERROR_CODES.AUTH_INITDATA_EXPIRED,
        `initData is too old (${ageSec}s > ${this.env.INITDATA_MAX_AGE_SEC}s)`,
      );
    }

    let user: TelegramUser | undefined;
    const userRaw = params.get('user');
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as TelegramUser;
      } catch {
        throw new AppException(
          ERROR_CODES.AUTH_INITDATA_INVALID,
          'initData user payload malformed',
        );
      }
    }

    return {
      user,
      auth_date: authDate,
      query_id: params.get('query_id') ?? undefined,
      start_param: params.get('start_param') ?? undefined,
      hash,
    };
  }

  /**
   * Verifies a Telegram **Login Widget** callback (browser sign-in), which uses
   * a different derivation than Mini App initData:
   *
   *   secret_key     = SHA256(bot_token)               // raw digest, not an HMAC
   *   data_check_str = newline-joined sorted "key=value" pairs, minus `hash`
   *   expected       = HEX(HMAC_SHA256(key=secret_key, data=data_check_str))
   *
   * https://core.telegram.org/widgets/login#checking-authorization
   */
  verifyLoginWidget(payload: Record<string, unknown>): TelegramUser & { auth_date: number } {
    const { hash, ...rest } = payload as Record<string, string | number | undefined> & {
      hash?: string;
    };
    if (!hash) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'login payload is missing hash');
    }

    const dataCheckString = Object.entries(rest)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secretKey = createHash('sha256').update(this.env.TELEGRAM_BOT_TOKEN).digest();
    const expected = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(String(hash), 'hex');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'login signature mismatch');
    }

    const authDate = Number(rest.auth_date);
    if (!Number.isFinite(authDate)) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'login payload has no auth_date');
    }
    const ageSec = Math.floor(Date.now() / 1000) - authDate;
    if (ageSec > this.env.INITDATA_MAX_AGE_SEC) {
      throw new AppException(
        ERROR_CODES.AUTH_INITDATA_EXPIRED,
        `login payload is too old (${ageSec}s)`,
      );
    }

    const id = Number(rest.id);
    if (!Number.isFinite(id)) {
      throw new AppException(ERROR_CODES.AUTH_INITDATA_INVALID, 'login payload has no user id');
    }

    return {
      id,
      first_name: String(rest.first_name ?? ''),
      last_name: rest.last_name ? String(rest.last_name) : undefined,
      username: rest.username ? String(rest.username) : undefined,
      photo_url: rest.photo_url ? String(rest.photo_url) : undefined,
      auth_date: authDate,
    };
  }
}
