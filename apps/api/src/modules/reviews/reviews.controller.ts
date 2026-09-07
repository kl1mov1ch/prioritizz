import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { createReviewSchema, reviewListQuerySchema, sellerReplySchema } from '@prioritizz/schemas';
import { ReviewsService } from './reviews.service';
import { createZodDto } from '../../common/zod-dto';
import { Public } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class CreateReviewDto extends createZodDto(createReviewSchema) {}
class SellerReplyDto extends createZodDto(sellerReplySchema) {}

@ApiTags('reviews')
@Controller({ version: '1' })
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Public()
  @Get('services/:serviceId/reviews')
  byService(@Param('serviceId') serviceId: string, @Query() q: Record<string, string>) {
    return this.reviews.listByService(reviewListQuerySchema.parse({ ...q, serviceId }));
  }

  @Public()
  @Get('services/:serviceId/reviews/summary')
  serviceSummary(@Param('serviceId') serviceId: string) {
    return this.reviews.summaryForService(serviceId);
  }

  @Public()
  @Get('sellers/:sellerId/reviews')
  bySeller(@Param('sellerId') sellerId: string, @Query() q: Record<string, string>) {
    return this.reviews.listBySeller(reviewListQuerySchema.parse({ ...q, sellerId }));
  }

  @ApiBearerAuth()
  @Post('reviews')
  create(@CurrentUser() u: AuthContext, @Body() dto: CreateReviewDto) {
    return this.reviews.create(u.userId, dto);
  }

  @ApiBearerAuth()
  @Post('reviews/:id/reply')
  reply(@CurrentUser() u: AuthContext, @Param('id') id: string, @Body() dto: SellerReplyDto) {
    return this.reviews.reply(u.userId, id, dto);
  }
}
