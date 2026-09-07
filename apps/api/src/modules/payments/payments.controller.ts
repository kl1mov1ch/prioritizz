import { Body, Controller, Get, Headers, Param, Post, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createPaymentIntentSchema } from '@prioritizz/schemas';
import { loadEnv } from '@prioritizz/config';
import { ERROR_CODES } from '@prioritizz/constants';
import { PaymentsService } from './payments.service';
import { createZodDto } from '../../common/zod-dto';
import { Public } from '../../common/decorators/roles.decorator';
import {
  Idempotent,
  IdempotencyInterceptor,
} from '../../common/interceptors/idempotency.interceptor';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';
import { AppException } from '../../common/errors/app-exception';

class CreateIntentDto extends createZodDto(createPaymentIntentSchema) {}

@ApiTags('payments')
@Controller({ version: '1' })
export class PaymentsController {
  private readonly env = loadEnv();

  constructor(private readonly payments: PaymentsService) {}

  @ApiBearerAuth()
  @Post('payments/intents')
  @Idempotent('payments.createIntent')
  @UseInterceptors(IdempotencyInterceptor)
  create(@CurrentUser() u: AuthContext, @Body() dto: CreateIntentDto) {
    return this.payments.createIntent(u.userId, dto);
  }

  @ApiBearerAuth()
  @Get('payments/intents/:id')
  get(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.payments.getIntent(u.userId, id);
  }

  /**
   * Called by the bot after a `successful_payment` update. Shared-secret auth
   * via the same header Telegram uses for its own webhook.
   */
  @Public()
  @Post('webhooks/telegram/payment')
  async telegramPayment(
    @Headers('x-telegram-bot-api-secret-token') secret: string | undefined,
    @Body() body: { payload?: string; charge_id?: string; raw?: Record<string, unknown> },
  ) {
    if (!secret || secret !== this.env.TELEGRAM_WEBHOOK_SECRET) {
      throw new AppException(ERROR_CODES.PAYMENT_WEBHOOK_SIGNATURE_INVALID, 'bad secret');
    }
    if (!body.payload || !body.charge_id) {
      throw AppException.validation('payload and charge_id required');
    }
    return this.payments.capture(body.payload, body.charge_id, {
      provider: 'telegram_stars',
      ...(body.raw ?? {}),
    });
  }
}
