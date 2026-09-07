import * as React from 'react';
import { cn } from '../cn.js';
import { IconImage, IconPlus, IconTrash, IconAlert, IconSpinner } from '../icons.js';

export interface UploadItem {
  id: string;
  /** Object URL while uploading, public URL once confirmed. */
  url: string;
  status: 'uploading' | 'ready' | 'error';
}

export interface ImageUploaderProps {
  items: UploadItem[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  max?: number;
  accept?: string;
  disabled?: boolean;
  className?: string;
  labels: { add: string; remove: string; empty: string };
}

/**
 * Controlled thumbnail grid. Upload transport lives in the app (it needs the
 * media API); this only renders state and raises intent, so it stays reusable
 * for listings, disputes and chat attachments alike.
 */
export function ImageUploader({
  items,
  onAdd,
  onRemove,
  max = 10,
  accept = 'image/png,image/jpeg,image/webp',
  disabled,
  className,
  labels,
}: ImageUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const full = items.length >= max;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.id} className="relative aspect-square overflow-hidden rounded-xl bg-grouped">
            <img src={it.url} alt="" className="h-full w-full object-cover" />

            {it.status !== 'ready' && (
              <span className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                {it.status === 'uploading' ? <IconSpinner size={20} /> : <IconAlert size={20} />}
              </span>
            )}

            <button
              type="button"
              aria-label={labels.remove}
              disabled={disabled}
              onClick={() => onRemove(it.id)}
              className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/55 text-white transition-transform duration-150 active:scale-90"
            >
              <IconTrash size={14} />
            </button>
          </div>
        ))}

        {!full && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            aria-label={labels.add}
            className="grid aspect-square place-items-center rounded-xl border border-dashed border-separator bg-grouped/50 text-subtle transition-transform duration-150 active:scale-95 disabled:opacity-40"
          >
            <IconPlus size={22} />
          </button>
        )}
      </div>

      {items.length === 0 && (
        <p className="flex items-center gap-1.5 text-caption text-subtle">
          <IconImage size={13} />
          {labels.empty}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []).slice(0, max - items.length);
          e.target.value = '';
          if (files.length) onAdd(files);
        }}
      />
    </div>
  );
}
