import * as React from 'react';
import { cn } from '../cn.js';
import { IconCamera } from '../icons.js';

const SIZES = {
  sm: 'h-8 w-8 text-caption',
  md: 'h-11 w-11 text-subhead',
  lg: 'h-14 w-14 text-title3',
  xl: 'h-20 w-20 text-title2',
} as const;

export type AvatarSize = keyof typeof SIZES;

/** Initials from a name pair, e.g. ("Ada", "Lovelace") → "AL". Falls back to "?". */
export function initialsOf(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? '';
  const b = last?.trim()?.[0] ?? '';
  return (a + b).toUpperCase() || '?';
}

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  /** Shown when `src` is absent or fails to load. */
  initials?: string;
  size?: AvatarSize;
  alt?: string;
}

/**
 * Photo with an initials fallback. A broken or slow `src` degrades to initials
 * rather than a broken-image glyph, which matters on flaky mobile networks.
 */
export const Avatar = React.forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, initials = '?', size = 'md', alt = '', className, ...props }, ref) => {
    const [failed, setFailed] = React.useState(false);
    // A new src deserves a fresh attempt.
    React.useEffect(() => setFailed(false), [src]);
    const showImage = !!src && !failed;

    return (
      <span
        ref={ref}
        className={cn(
          'relative grid shrink-0 select-none place-items-center overflow-hidden rounded-full bg-primary font-display font-semibold text-primary-foreground',
          SIZES[size],
          className,
        )}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          initials
        )}
      </span>
    );
  },
);
Avatar.displayName = 'Avatar';

export interface AvatarPickerProps extends Omit<AvatarProps, 'onChange'> {
  onPick: (file: File) => void;
  /** Disables the control while an upload is in flight. */
  busy?: boolean;
  label: string;
  accept?: string;
}

/** Avatar with a camera affordance that opens the file picker. */
export function AvatarPicker({
  onPick,
  busy,
  label,
  accept = 'image/png,image/jpeg,image/webp',
  size = 'xl',
  className,
  ...avatarProps
}: AvatarPickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <span className={cn('relative inline-block', className)}>
      <Avatar size={size} {...avatarProps} className={cn(busy && 'opacity-60')} />
      <button
        type="button"
        aria-label={label}
        title={label}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-0.5 -right-0.5 grid h-8 w-8 place-items-center rounded-full bg-elevated text-foreground shadow-float transition-transform duration-150 active:scale-90 disabled:opacity-50"
      >
        <IconCamera size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so picking the same file twice still fires onChange.
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
    </span>
  );
}
