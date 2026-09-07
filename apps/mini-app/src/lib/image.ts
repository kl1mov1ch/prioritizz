import { IMAGE_MAX_EDGE_PX, IMAGE_MIME_TYPES, MAX_IMAGE_BYTES } from '@prioritizz/schemas';

export interface CompressOptions {
  /** Longest edge after downscaling. */
  maxEdge?: number;
  /** Starting JPEG/WebP quality; lowered automatically if still too big. */
  quality?: number;
  maxBytes?: number;
}

export class ImageError extends Error {
  constructor(
    readonly reason: 'type' | 'decode' | 'encode' | 'too-large',
    message: string,
  ) {
    super(message);
    this.name = 'ImageError';
  }
}

/** Cheap guard before we spend memory decoding. */
export function isSupportedImage(file: File): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
}

function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap handles EXIF orientation and is far cheaper than an
  // <img> round-trip, but Telegram's older WebViews lack it.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImg(file));
  }
  return loadViaImg(file);
}

function loadViaImg(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('decode', 'Could not read the image'));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Downscales and re-encodes an image in the browser so uploads stay small on a
 * mobile connection. A 12 MP phone photo (~5 MB) comes out around 150–350 KB,
 * which is why the server can accept a single request instead of a presigned
 * PUT. Falls back through decreasing quality until it fits the byte budget.
 */
export async function compressImage(
  file: File,
  { maxEdge = IMAGE_MAX_EDGE_PX, quality = 0.82, maxBytes = MAX_IMAGE_BYTES }: CompressOptions = {},
): Promise<Blob> {
  if (!isSupportedImage(file)) {
    throw new ImageError('type', 'Only JPEG, PNG and WebP images are supported');
  }

  const source = await loadBitmap(file);
  const sw = 'width' in source ? source.width : 0;
  const sh = 'height' in source ? source.height : 0;
  if (!sw || !sh) throw new ImageError('decode', 'Image has no dimensions');

  const scale = Math.min(1, maxEdge / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ImageError('encode', 'Canvas is unavailable');
  ctx.drawImage(source as CanvasImageSource, 0, 0, w, h);
  if ('close' in source) source.close();

  // PNG keeps transparency; everything else is cheaper as JPEG.
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  for (const q of [quality, 0.7, 0.6, 0.5, 0.4]) {
    const blob = await toBlob(canvas, type, q);
    if (blob && blob.size <= maxBytes) return blob;
    if (type === 'image/png') break; // quality is ignored for PNG — retrying is pointless
  }

  throw new ImageError('too-large', 'Image is still too large after compression');
}
