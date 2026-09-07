import { useCallback, useState } from 'react';
import type { UploadItem } from '@prioritizz/ui';
import { MAX_SERVICE_IMAGES } from '@prioritizz/schemas';
import { api } from '../lib/api';
import { compressImage, ImageError } from '../lib/image';

let tempSeq = 0;

interface Options {
  ownerType: 'SERVICE' | 'USER' | 'ORDER';
  max?: number;
  onError?: (message: ImageError | Error) => void;
}

/**
 * Compress-then-upload pipeline for the image grid. Each file gets an optimistic
 * row backed by an object URL so the thumbnail appears instantly, then flips to
 * the stored attachment once the server responds.
 */
export function useImageUpload({ ownerType, max = MAX_SERVICE_IMAGES, onError }: Options) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const reset = useCallback((next: UploadItem[]) => setItems(next), []);

  const add = useCallback(
    async (files: File[]) => {
      const room = max - items.length;
      for (const file of files.slice(0, room)) {
        const tempId = `tmp-${++tempSeq}`;
        const preview = URL.createObjectURL(file);
        setItems((prev) => [...prev, { id: tempId, url: preview, status: 'uploading' }]);

        try {
          const blob = await compressImage(file);
          const attachment = await api.media.upload(blob, ownerType, file.name);
          setItems((prev) =>
            prev.map((it) =>
              it.id === tempId ? { id: attachment.id, url: attachment.url, status: 'ready' } : it,
            ),
          );
        } catch (err) {
          setItems((prev) =>
            prev.map((it) => (it.id === tempId ? { ...it, status: 'error' } : it)),
          );
          onError?.(err instanceof Error ? err : new Error('Upload failed'));
        } finally {
          URL.revokeObjectURL(preview);
        }
      }
    },
    [items.length, max, ownerType, onError],
  );

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    // Best-effort: an orphaned object is harmless, a failed delete must not
    // block the form.
    if (!id.startsWith('tmp-')) void api.media.remove(id).catch(() => undefined);
  }, []);

  /** Confirmed attachment ids, in display order — what the listing form submits. */
  const attachmentIds = items.filter((i) => i.status === 'ready').map((i) => i.id);
  const busy = items.some((i) => i.status === 'uploading');

  return { items, add, remove, reset, attachmentIds, busy };
}
