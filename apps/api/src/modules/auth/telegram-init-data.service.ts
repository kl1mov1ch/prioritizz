import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
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
}
