import { Global, Module } from '@nestjs/common';
import { SellerContext } from './seller-context.service';

@Global()
@Module({
  providers: [SellerContext],
  exports: [SellerContext],
})
export class SellersModule {}
