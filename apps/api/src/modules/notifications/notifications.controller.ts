import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller({ path: 'me/notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() u: AuthContext) {
    return this.notifications.list(u.userId);
  }

  @Post('read')
  markRead(@CurrentUser() u: AuthContext) {
    return this.notifications.markAllRead(u.userId);
  }
}
