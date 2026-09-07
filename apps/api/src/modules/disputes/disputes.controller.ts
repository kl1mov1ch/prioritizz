import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  disputeListQuerySchema,
  disputeMessageSchema,
  openDisputeSchema,
  resolveDisputeSchema,
} from '@prioritizz/schemas';
import { PERMISSIONS } from '@prioritizz/constants';
import { DisputesService } from './disputes.service';
import { createZodDto } from '../../common/zod-dto';
import { AdminOnly, RequirePermission } from '../../common/decorators/roles.decorator';
import {
  Idempotent,
  IdempotencyInterceptor,
} from '../../common/interceptors/idempotency.interceptor';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class OpenDisputeDto extends createZodDto(openDisputeSchema) {}
class DisputeMessageDto extends createZodDto(disputeMessageSchema) {}
class ResolveDisputeDto extends createZodDto(resolveDisputeSchema) {}

@ApiTags('disputes')
@ApiBearerAuth()
@Controller({ version: '1' })
export class DisputesController {
  constructor(private readonly disputes: DisputesService) {}

  // ---- party (buyer / seller) ----

  @Post('disputes')
  @Idempotent('disputes.open')
  @UseInterceptors(IdempotencyInterceptor)
  open(@CurrentUser() u: AuthContext, @Body() dto: OpenDisputeDto) {
    return this.disputes.open(u.userId, dto);
  }

  @Get('disputes/:id')
  get(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.disputes.get(u.userId, id);
  }

  @Get('disputes/:id/messages')
  messages(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.disputes.listMine(u.userId, id);
  }

  @Post('disputes/:id/messages')
  reply(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: DisputeMessageDto) {
    return this.disputes.addMessage(u.userId, id, dto.body);
  }

  // ---- admin ----

  @AdminOnly()
  @RequirePermission(PERMISSIONS.DISPUTES_RESOLVE)
  @Get('admin/disputes')
  adminList(@Query() query: Record<string, string>) {
    return this.disputes.adminList(disputeListQuerySchema.parse(query));
  }

  @AdminOnly()
  @RequirePermission(PERMISSIONS.DISPUTES_RESOLVE)
  @Get('admin/disputes/:id/thread')
  adminThread(@Param('id') id: string) {
    return this.disputes.adminThread(id);
  }

  @AdminOnly()
  @RequirePermission(PERMISSIONS.DISPUTES_RESOLVE)
  @Post('admin/disputes/:id/resolve')
  resolve(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(u.userId, id, dto);
  }
}
