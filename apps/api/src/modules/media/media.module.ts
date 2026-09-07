import { Global, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { S3Service } from './s3.service';

/** Global so catalog (and later orders/disputes) can claim attachments. */
@Global()
@Module({
  controllers: [MediaController],
  providers: [MediaService, S3Service],
  exports: [MediaService, S3Service],
})
export class MediaModule {}
