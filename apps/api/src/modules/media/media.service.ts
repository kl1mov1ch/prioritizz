import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { ERROR_CODES } from '@prioritizz/constants';
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  type PresignUploadInput,
  type PresignResult,
} from '@prioritizz/schemas';
import { PrismaService } from '../../prisma/prisma.service';
import { AppException } from '../../common/errors/app-exception';
import { S3Service } from './s3.service';

/** Structural shape of a multer file — avoids depending on ambient Express types. */
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

/**
 * Identifies an image from its magic bytes. The browser-declared mimetype is
 * attacker-controlled, and this bucket is public-read.
 */
function sniffImageMime(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
  ) {}

  /**
   * Reserve a key and hand back a presigned PUT. The row starts unconfirmed;
   * only `confirm()` — which verifies the bytes really landed — makes it
   * linkable to a listing.
   */
  async presign(userId: string, input: PresignUploadInput): Promise<PresignResult> {
    if (!IMAGE_MIME_TYPES.includes(input.mimeType)) {
      throw new AppException(ERROR_CODES.FILE_TYPE_NOT_ALLOWED, `${input.mimeType} is not allowed`);
    }
    if (input.sizeBytes > MAX_IMAGE_BYTES) {
      throw new AppException(
        ERROR_CODES.FILE_TOO_LARGE,
        `File exceeds ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB`,
      );
    }

    // Extension comes from the validated mime, never from the client filename.
    const ext = EXT_BY_MIME[input.mimeType] ?? extname(input.filename).slice(0, 8);
    const key = `${input.ownerType.toLowerCase()}/${userId}/${randomUUID()}${ext}`;

    const attachment = await this.prisma.attachment.create({
      data: {
        ownerType: input.ownerType,
        // Null until claim() binds it — the listing may not exist yet.
        ownerId: input.ownerId ?? null,
        uploaderId: userId,
        bucket: this.s3.bucket,
        key,
        url: this.s3.publicUrl(key),
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        kind: 'image',
        isConfirmed: false,
      },
      select: { id: true, url: true },
    });

    return {
      attachmentId: attachment.id,
      uploadUrl: await this.s3.presignPut(key, input.mimeType),
      publicUrl: attachment.url,
      expiresInSec: this.s3.ttlSec,
    };
  }

  /**
   * Single-round-trip upload: validate, store, return a usable attachment.
   * Magic bytes are checked because `mimetype` is client-supplied and a
   * renamed executable would otherwise be served from a public bucket.
   */
  async upload(userId: string, ownerType: string, file: UploadedImage) {
    const sniffed = sniffImageMime(file.buffer);
    if (!sniffed) {
      throw new AppException(ERROR_CODES.FILE_TYPE_NOT_ALLOWED, 'File is not a supported image');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new AppException(
        ERROR_CODES.FILE_TOO_LARGE,
        `File exceeds ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)} MB`,
      );
    }

    const key = `${ownerType.toLowerCase()}/${userId}/${randomUUID()}${EXT_BY_MIME[sniffed]}`;
    await this.s3.put(key, file.buffer, sniffed);

    const attachment = await this.prisma.attachment.create({
      data: {
        ownerType: ownerType as never,
        ownerId: null,
        uploaderId: userId,
        bucket: this.s3.bucket,
        key,
        url: this.s3.publicUrl(key),
        mimeType: sniffed,
        sizeBytes: file.size,
        kind: 'image',
        isConfirmed: true, // the bytes are already in the bucket
      },
    });
    return this.serialize(attachment);
  }

  /** Verify the upload landed, record its true size, and mark it usable. */
  async confirm(userId: string, attachmentId: string) {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, uploaderId: userId, deletedAt: null },
    });
    if (!attachment) throw AppException.notFound('Attachment not found');
    if (attachment.isConfirmed) return this.serialize(attachment);

    const head = await this.s3.head(attachment.key);
    if (!head) {
      throw new AppException(ERROR_CODES.VALIDATION_FAILED, 'Upload was not completed');
    }
    if (head.sizeBytes > MAX_IMAGE_BYTES) {
      // The real object beat the declared size — drop it rather than serve it.
      await this.s3.remove(attachment.key);
      await this.prisma.attachment.delete({ where: { id: attachment.id } });
      throw new AppException(ERROR_CODES.FILE_TOO_LARGE, 'Uploaded file is too large');
    }

    const updated = await this.prisma.attachment.update({
      where: { id: attachment.id },
      data: { isConfirmed: true, sizeBytes: head.sizeBytes },
    });
    return this.serialize(updated);
  }

  async remove(userId: string, attachmentId: string): Promise<void> {
    const attachment = await this.prisma.attachment.findFirst({
      where: { id: attachmentId, uploaderId: userId, deletedAt: null },
    });
    if (!attachment) throw AppException.notFound('Attachment not found');

    await this.prisma.attachment.update({
      where: { id: attachment.id },
      data: { deletedAt: new Date() },
    });
    await this.s3.remove(attachment.key);
  }

  /**
   * Resolves ids the caller claims to own into confirmed attachments and binds
   * them to their parent. Rejects anything unconfirmed or owned by someone
   * else, so a listing can never embed another user's upload.
   */
  async claim(
    userId: string,
    ownerType: string,
    ownerId: string,
    attachmentIds: string[],
  ): Promise<void> {
    if (attachmentIds.length === 0) return;

    const owned = await this.prisma.attachment.findMany({
      where: {
        id: { in: attachmentIds },
        uploaderId: userId,
        ownerType: ownerType as never,
        isConfirmed: true,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (owned.length !== attachmentIds.length) {
      throw new AppException(
        ERROR_CODES.VALIDATION_FAILED,
        'Some attachments are unknown, unconfirmed or not yours',
      );
    }

    await this.prisma.attachment.updateMany({
      where: { id: { in: attachmentIds } },
      data: { ownerId },
    });
  }

  /** Confirmed media for a parent row, oldest first. */
  async listFor(ownerType: string, ownerId: string) {
    const rows = await this.prisma.attachment.findMany({
      where: { ownerType: ownerType as never, ownerId, isConfirmed: true, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => this.serialize(r));
  }

  private serialize(a: {
    id: string;
    url: string;
    kind: string;
    mimeType: string | null;
    sizeBytes: number | null;
  }) {
    return {
      id: a.id,
      url: a.url,
      kind: a.kind,
      mimeType: a.mimeType ?? 'application/octet-stream',
      sizeBytes: a.sizeBytes ?? 0,
    };
  }
}
