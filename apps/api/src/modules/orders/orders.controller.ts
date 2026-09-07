import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createOrderSchema,
  orderCancelSchema,
  orderConfirmSchema,
  orderDeliverSchema,
  orderListQuerySchema,
} from '@prioritizz/schemas';
import { OrdersService } from './orders.service';
import { createZodDto } from '../../common/zod-dto';
import {
  Idempotent,
  IdempotencyInterceptor,
} from '../../common/interceptors/idempotency.interceptor';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class CreateOrderDto extends createZodDto(createOrderSchema) {}
class DeliverDto extends createZodDto(orderDeliverSchema) {}
class ConfirmDto extends createZodDto(orderConfirmSchema) {}
class CancelDto extends createZodDto(orderCancelSchema) {}

@ApiTags('orders')
@ApiBearerAuth()
@Controller({ path: 'orders', version: '1' })
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  list(@CurrentUser() u: AuthContext, @Query() query: Record<string, string>) {
    return this.orders.list(u.userId, orderListQuerySchema.parse(query));
  }

  @Get(':id')
  get(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.orders.get(u.userId, id);
  }

  @Get(':id/events')
  timeline(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.orders.timeline(u.userId, id);
  }

  @Post()
  @Idempotent('orders.create')
  @UseInterceptors(IdempotencyInterceptor)
  create(@CurrentUser() u: AuthContext, @Body() dto: CreateOrderDto) {
    return this.orders.create(u.userId, dto);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: CancelDto) {
    return this.orders.cancel(u.userId, id, dto.reason);
  }

  @Post(':id/deliver')
  deliver(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: DeliverDto) {
    return this.orders.deliver(u.userId, id, dto.payload, dto.note);
  }

  @Post(':id/confirm')
  confirm(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: ConfirmDto) {
    const review =
      dto.rating != null ? { rating: dto.rating, text: dto.reviewText ?? undefined } : undefined;
    return this.orders.confirm(u.userId, id, review);
  }
}
