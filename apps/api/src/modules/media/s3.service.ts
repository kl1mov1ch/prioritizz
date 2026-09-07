import { Injectable, Logger } from '@nestjs/common';
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { loadEnv } from '@prioritizz/config';

/** Presigned PUT lifetime. Long enough for a slow mobile upload, short enough
 *  that a leaked URL is not a lasting hole. */
const PRESIGN_TTL_SEC = 300;

@Injectable()
export class S3Service {
  private readonly log = new Logger(S3Service.name);
  private readonly env = loadEnv();

  private readonly client = new S3Client({
    endpoint: this.env.S3_ENDPOINT,
    region: this.env.S3_REGION,
    // MinIO speaks path-style; real S3 wants virtual-host style.
    forcePathStyle: this.env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: this.env.S3_ACCESS_KEY_ID,
      secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
    },
  });

  readonly bucket = this.env.S3_BUCKET;
  readonly ttlSec = PRESIGN_TTL_SEC;

  /** Public read URL for a stored object. */
  publicUrl(key: string): string {
    return `${this.env.S3_PUBLIC_URL.replace(/\/+$/, '')}/${key}`;
  }

  /** Server-side upload. Used by the mini-app: a presigned PUT would be signed
   *  for the internal MinIO host, which a phone on the tunnel cannot resolve. */
  async put(key: string, body: Buffer, mimeType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }

  async presignPut(key: string, mimeType: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new PutObjectCommand({ Bucket: this.bucket, Key: key, ContentType: mimeType }),
      { expiresIn: PRESIGN_TTL_SEC },
    );
  }

  /**
   * Confirms the object actually landed and reports its real size — the client
   * declares `sizeBytes` before uploading, so it must never be trusted after.
   */
  async head(key: string): Promise<{ sizeBytes: number; mimeType?: string } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { sizeBytes: Number(res.ContentLength ?? 0), mimeType: res.ContentType };
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch (err) {
      // Orphaned objects are a janitor problem, never a request failure.
      this.log.warn(`failed to delete ${key}: ${String(err)}`);
    }
  }
}
