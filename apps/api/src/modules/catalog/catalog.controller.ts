import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { serviceListQuerySchema, serviceUpsertSchema } from '@prioritizz/schemas';
import { ROLES } from '@prioritizz/constants';
import { CatalogService } from './catalog.service';
import { createZodDto } from '../../common/zod-dto';
import { Public } from '../../common/decorators/roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';
import { SellerContext } from '../sellers/seller-context.service';

class ServiceUpsertDto extends createZodDto(serviceUpsertSchema) {}

@ApiTags('catalog')
@Controller({ version: '1' })
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly sellerCtx: SellerContext,
  ) {}

  @Public()
  @Get('categories')
  categories() {
    return this.catalog.categories();
  }

  @Public()
  @Get('services')
  list(@Query() query: Record<string, string>) {
    return this.catalog.listServices(serviceListQuerySchema.parse(query));
  }

  @Public()
  @Get('services/:idOrSlug')
  get(@Param('idOrSlug') idOrSlug: string) {
    return this.catalog.getService(idOrSlug);
  }

  // ---- seller endpoints ----

  @ApiBearerAuth()
  @Roles(ROLES.SELLER)
  @Post('seller/services')
  async create(@CurrentUser() u: AuthContext, @Body() dto: ServiceUpsertDto) {
    const sellerId = await this.sellerCtx.requireSellerId(u.userId);
    return this.catalog.createDraft(sellerId, u.userId, dto);
  }

  @ApiBearerAuth()
  @Roles(ROLES.SELLER)
  @Put('seller/services/:id')
  async update(
    @CurrentUser() u: AuthContext,
    @Param('id') id: string,
    @Body() dto: ServiceUpsertDto,
  ) {
    const sellerId = await this.sellerCtx.requireSellerId(u.userId);
    return this.catalog.update(sellerId, u.userId, id, dto);
  }

  /** Seller's own listings, including drafts — the storefront list is public. */
  @ApiBearerAuth()
  @Roles(ROLES.SELLER)
  @Get('seller/services')
  async mine(@CurrentUser() u: AuthContext, @Query() query: Record<string, string>) {
    const sellerId = await this.sellerCtx.requireSellerId(u.userId);
    return this.catalog.listServices(
      { ...serviceListQuerySchema.parse(query), sellerId },
      { anyStatus: true },
    );
  }

  @ApiBearerAuth()
  @Roles(ROLES.SELLER)
  @Post('seller/services/:id/submit')
  async submit(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    const sellerId = await this.sellerCtx.requireSellerId(u.userId);
    return this.catalog.submitForReview(sellerId, id);
  }

  @ApiBearerAuth()
  @Roles(ROLES.SELLER)
  @Post('seller/services/:id/pause')
  async pause(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    const sellerId = await this.sellerCtx.requireSellerId(u.userId);
    return this.catalog.pause(sellerId, id);
  }
}
