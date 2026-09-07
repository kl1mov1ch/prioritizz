import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  attachmentOwnerTypeSchema,
  MAX_IMAGE_BYTES,
  presignUploadSchema,
} from '@prioritizz/schemas';
import { ERROR_CODES } from '@prioritizz/constants';
import { MediaService, type UploadedImage } from './media.service';
import { createZodDto } from '../../common/zod-dto';
import { AppException } from '../../common/errors/app-exception';
import { CurrentUser, type AuthContext } from '../../common/decorators/current-user.decorator';

class PresignUploadDto extends createZodDto(presignUploadSchema) {}

@ApiTags('media')
@ApiBearerAuth()
@Controller({ path: 'media', version: '1' })
export class MediaController {
  constructor(private readonly media: MediaService) {}

  /**
   * Direct upload — what the mini-app uses. Memory storage is safe because the
   * limit is small and the client already compressed the image.
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }))
  upload(
    @CurrentUser() u: AuthContext,
    @UploadedFile() file: UploadedImage | undefined,
    @Query('ownerType') ownerType?: string,
  ) {
    if (!file) throw AppException.validation('No file was uploaded');
    const parsed = attachmentOwnerTypeSchema.safeParse(ownerType);
    if (!parsed.success) {
      throw new AppException(ERROR_CODES.VALIDATION_FAILED, 'Unknown ownerType');
    }
    return this.media.upload(u.userId, parsed.data, file);
  }

  /** Presigned flow, kept for real S3 where the browser can reach the bucket. */
  @Post('presign')
  presign(@CurrentUser() u: AuthContext, @Body() dto: PresignUploadDto) {
    return this.media.presign(u.userId, dto);
  }

  /** Step 2 — after the PUT succeeds, prove it landed and make it usable. */
  @Post(':id/confirm')
  confirm(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    return this.media.confirm(u.userId, id);
  }

  @Delete(':id')
  async remove(@CurrentUser() u: AuthContext, @Param('id') id: string) {
    await this.media.remove(u.userId, id);
    return { ok: true };
  }
}
