import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { AdminLoginDto, RefreshDto, TelegramLoginDto } from './dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private device(req: Request) {
    return { ip: req.ip ?? null, userAgent: req.header('user-agent') ?? null };
  }

  @Public()
  @Post('telegram')
  telegram(@Body() dto: TelegramLoginDto, @Req() req: Request) {
    return this.auth.loginWithTelegram(dto.initData, this.device(req));
  }

  @Public()
  @Post('admin/login')
  adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.auth.adminLogin(dto, this.device(req));
  }

  @Public()
  @Post('refresh')
  refresh(@Body() dto: RefreshDto, @Req() req: Request) {
    return this.auth.refresh(dto.refreshToken, this.device(req));
  }

  @Post('logout')
  async logout(@CurrentUser() user: AuthContext) {
    await this.auth.logout(user.sessionId);
    return { ok: true };
  }

  @Get('sessions')
  sessions(@CurrentUser() user: AuthContext) {
    return this.auth.listSessions(user.userId).then((items) => ({ items }));
  }
}
