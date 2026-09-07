import { z } from 'zod';
import { ATTACHMENT_OWNER } from '@prioritizz/constants';
import { idSchema } from './common.js';

/**
 * Upload limits. These are the *server* ceiling — the client compresses images
 * well below this before asking for a presigned URL, so hitting the cap means
 * either a non-image or a deliberately crafted request.
 */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_SERVICE_IMAGES = 8;
export const IMAGE_MAX_EDGE_PX = 1600;

export const imageMimeSchema = z.enum(IMAGE_MIME_TYPES);

export const attachmentOwnerTypeSchema = z.enum(ATTACHMENT_OWNER);

export const presignUploadSchema = z.object({
  ownerType: attachmentOwnerTypeSchema,
  /** Absent while the owner does not exist yet (creating a draft listing). */
  ownerId: idSchema.optional(),
  filename: z.string().trim().min(1).max(200),
  mimeType: imageMimeSchema,
  sizeBytes: z.number().int().positive().max(MAX_IMAGE_BYTES),
});
export type PresignUploadInput = z.infer<typeof presignUploadSchema>;

export const presignResultSchema = z.object({
  attachmentId: idSchema,
  /** PUT the bytes here with the exact Content-Type that was requested. */
  uploadUrl: z.string().url(),
  /** Where the object will be readable once confirmed. */
  publicUrl: z.string().url(),
  expiresInSec: z.number().int().positive(),
});
export type PresignResult = z.infer<typeof presignResultSchema>;

export const attachmentSchema = z.object({
  id: idSchema,
  url: z.string().url(),
  kind: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().nonnegative(),
});
export type Attachment = z.infer<typeof attachmentSchema>;
