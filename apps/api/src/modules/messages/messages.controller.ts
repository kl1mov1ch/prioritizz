import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { chatListQuerySchema, orderMessageSchema } from '@prioritizz/schemas';
import { MessagesService } from './messages.service';
import { createZodDto } from '../../common/zod-dto';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class SendMessageDto extends createZodDto(orderMessageSchema) {}

@ApiTags('messages')
@ApiBearerAuth()
@Controller({ path: 'orders/:orderId/messages', version: '1' })
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Get()
  list(
    @CurrentUser() u: AuthContext,
    @Param('orderId') orderId: string,
    @Query() query: Record<string, string>,
  ) {
    return this.messages.list(u.userId, orderId, chatListQuerySchema.parse(query));
  }

  @Post()
  send(
    @CurrentUser() u: AuthContext,
    @Param('orderId') orderId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.send(u.userId, orderId, dto);
  }

  @Post('read')
  read(@CurrentUser() u: AuthContext, @Param('orderId') orderId: string) {
    return this.messages.markRead(u.userId, orderId);
  }
}
