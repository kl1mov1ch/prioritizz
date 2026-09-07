import { cn } from '../cn.js';
import { IconStar, IconStarHalf } from '../icons.js';

export interface RatingProps {
  /** 0..5, fractional allowed in read-only mode. */
  value: number;
  max?: number;
  size?: number;
  className?: string;
  /** Optional count rendered after the stars, already localised by the caller. */
  countLabel?: string;
}

/** Read-only star row. Rounds to the nearest half star. */
export function Rating({ value, max = 5, size = 14, className, countLabel }: RatingProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const halves = Math.round(clamped * 2);

  return (
    <span className={cn('inline-flex items-center gap-1 text-tint-yellow', className)}>
      <span
        className="inline-flex items-center gap-0.5"
        role="img"
        aria-label={`${clamped} / ${max}`}
      >
        {Array.from({ length: max }, (_, i) => {
          const filledHalves = Math.max(0, Math.min(2, halves - i * 2));
          if (filledHalves === 2) return <IconStar key={i} size={size} filled />;
          if (filledHalves === 1) return <IconStarHalf key={i} size={size} />;
          return <IconStar key={i} size={size} className="opacity-30" />;
        })}
      </span>
      {countLabel && <span className="text-caption text-subtle">{countLabel}</span>}
    </span>
  );
}

export interface RatingInputProps {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  size?: number;
  className?: string;
  label: string;
  disabled?: boolean;
}

/**
 * Interactive whole-star picker with radiogroup semantics: exactly one star is
 * `aria-checked`, only the selected star is in the tab order, and Left/Right
 * (Down/Up) move the selection — the pattern a screen reader expects.
 */
export function RatingInput({
  value,
  onChange,
  max = 5,
  size = 30,
  className,
  label,
  disabled,
}: RatingInputProps) {
  const step = (delta: number) => {
    if (disabled) return;
    const next = Math.min(max, Math.max(1, (value || 0) + delta));
    if (next !== value) onChange(next);
  };

  return (
    <span
      role="radiogroup"
      aria-label={label}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
          e.preventDefault();
          step(-1);
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
          e.preventDefault();
          step(1);
        }
      }}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {Array.from({ length: max }, (_, i) => {
        const star = i + 1;
        const filled = star <= value;
        const selected = star === value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={String(star)}
            tabIndex={selected || (value === 0 && star === 1) ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(star)}
            className={cn(
              'grid min-h-touch min-w-touch place-items-center rounded-lg transition-transform duration-150 active:scale-90 disabled:opacity-40',
              filled ? 'text-tint-yellow' : 'text-subtle',
            )}
          >
            <IconStar size={size} filled={filled} />
          </button>
        );
      })}
    </span>
  );
}
