import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  adminPayoutDecisionSchema,
  payoutListQuerySchema,
  requestPayoutSchema,
} from '@prioritizz/schemas';
import { PERMISSIONS } from '@prioritizz/constants';
import { PayoutsService } from './payouts.service';
import { createZodDto } from '../../common/zod-dto';
import { AdminOnly, RequirePermission } from '../../common/decorators/roles.decorator';
import {
  Idempotent,
  IdempotencyInterceptor,
} from '../../common/interceptors/idempotency.interceptor';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class RequestPayoutDto extends createZodDto(requestPayoutSchema) {}
class DecisionDto extends createZodDto(adminPayoutDecisionSchema) {}

@ApiTags('payouts')
@ApiBearerAuth()
@Controller({ version: '1' })
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  @Post('payouts')
  @Idempotent('payouts.request')
  @UseInterceptors(IdempotencyInterceptor)
  request(@CurrentUser() u: AuthContext, @Body() dto: RequestPayoutDto) {
    return this.payouts.request(u.userId, dto);
  }

  @Get('me/payouts')
  mine(@CurrentUser() u: AuthContext, @Query() q: Record<string, string>) {
    const query = payoutListQuerySchema.parse(q);
    return this.payouts.listMine(u.userId, query);
  }

  @AdminOnly()
  @RequirePermission(PERMISSIONS.PAYOUTS_APPROVE)
  @Get('admin/payouts')
  adminList(@Query() q: Record<string, string>) {
    return this.payouts.adminList(payoutListQuerySchema.parse(q));
  }

  @AdminOnly()
  @RequirePermission(PERMISSIONS.PAYOUTS_APPROVE)
  @Post('admin/payouts/:id/decision')
  decide(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: DecisionDto) {
    return this.payouts.decide(u.userId, id, dto);
  }
}
