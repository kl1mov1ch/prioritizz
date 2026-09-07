import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import {
  adminUpdateUserSchema,
  auditLogQuerySchema,
  commissionRuleUpsertSchema,
  featureFlagUpdateSchema,
  moderationDecisionSchema,
  paginationQuerySchema,
} from '@prioritizz/schemas';
import { PERMISSIONS } from '@prioritizz/constants';
import { AdminService } from './admin.service';
import { createZodDto } from '../../common/zod-dto';
import { AdminOnly, RequirePermission } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class AdminUpdateUserDto extends createZodDto(adminUpdateUserSchema) {}
class ModerationDecisionDto extends createZodDto(moderationDecisionSchema) {}
class CommissionRuleDto extends createZodDto(commissionRuleUpsertSchema) {}
class FeatureFlagDto extends createZodDto(featureFlagUpdateSchema) {}

@ApiTags('admin')
@ApiBearerAuth()
@AdminOnly()
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @RequirePermission(PERMISSIONS.AUDIT_READ)
  @Get('dashboard')
  dashboard(@Query('range') range = '7d') {
    return this.admin.dashboard(range);
  }

  // users
  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  @Get('users')
  users(@Query() q: Record<string, string>) {
    return this.admin.listUsers(paginationQuerySchema.parse(q));
  }

  @RequirePermission(PERMISSIONS.USERS_MANAGE)
  @Patch('users/:id')
  updateUser(
    @CurrentUser() u: AuthContext,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
    @Req() req: Request,
  ) {
    return this.admin.updateUser(u.userId, id, dto, req.ip);
  }

  // moderation
  @RequirePermission(PERMISSIONS.CATALOG_MODERATE)
  @Get('services')
  moderationQueue(@Query() q: Record<string, string>) {
    return this.admin.moderationQueue(paginationQuerySchema.parse(q));
  }

  @RequirePermission(PERMISSIONS.CATALOG_MODERATE)
  @Post('services/:id/moderate')
  moderate(
    @CurrentUser() u: AuthContext,
    @Param('id') id: string,
    @Body() dto: ModerationDecisionDto,
  ) {
    return this.admin.moderate(u.userId, id, dto);
  }

  // commission rules
  @RequirePermission(PERMISSIONS.COMMISSIONS_MANAGE)
  @Get('commission-rules')
  commissionRules() {
    return this.admin.commissionRules();
  }

  @RequirePermission(PERMISSIONS.COMMISSIONS_MANAGE)
  @Post('commission-rules')
  createRule(@CurrentUser() u: AuthContext, @Body() dto: CommissionRuleDto) {
    return this.admin.upsertCommissionRule(u.userId, dto);
  }

  @RequirePermission(PERMISSIONS.COMMISSIONS_MANAGE)
  @Put('commission-rules/:id')
  updateRule(
    @CurrentUser() u: AuthContext,
    @Param('id') id: string,
    @Body() dto: CommissionRuleDto,
  ) {
    return this.admin.upsertCommissionRule(u.userId, dto, id);
  }

  @RequirePermission(PERMISSIONS.COMMISSIONS_MANAGE)
  @Delete('commission-rules/:id')
  disableRule(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.admin.deleteCommissionRule(u.userId, id);
  }

  // audit + flags
  @RequirePermission(PERMISSIONS.AUDIT_READ)
  @Get('audit-logs')
  auditLog(@Query() q: Record<string, string>) {
    return this.admin.auditLog(auditLogQuerySchema.parse(q));
  }

  @RequirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE)
  @Get('feature-flags')
  flags() {
    return this.admin.featureFlags();
  }

  @RequirePermission(PERMISSIONS.FEATURE_FLAGS_MANAGE)
  @Put('feature-flags/:key')
  updateFlag(
    @CurrentUser() u: AuthContext,
    @Param('key') key: string,
    @Body() dto: FeatureFlagDto,
  ) {
    return this.admin.updateFeatureFlag(u.userId, key, dto);
  }
}
