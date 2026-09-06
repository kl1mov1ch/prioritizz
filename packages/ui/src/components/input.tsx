import * as React from 'react';
import { cn } from '../cn.js';

/**
 * Apple text field: grouped fill, no border, 10px radius, tint halo on focus.
 * `icon` renders a leading glyph inside the field.
 */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }
>(({ className, icon, ...props }, ref) => {
  if (!icon) return <input ref={ref} className={cn('field', className)} {...props} />;
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-subtle">
        {icon}
      </span>
      <input ref={ref} className={cn('field pl-10', className)} {...props} />
    </div>
  );
});
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn('field min-h-[88px] resize-y leading-normal', className)} {...props} />
));
Textarea.displayName = 'Textarea';

export const Label = ({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('mb-1.5 block text-footnote font-medium text-muted', className)} {...props} />
);

/** Label + control + optional hint, spaced on the 8pt grid. */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error ? (
        <p className="text-footnote text-tint-red">{error}</p>
      ) : hint ? (
        <p className="text-footnote text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  ariaLabel?: string;
}

/** UISegmentedControl. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  ariaLabel,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={cn('segmented', className)} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          data-active={value === o.value}
          aria-pressed={value === o.value}
          aria-label={o.ariaLabel}
          title={o.ariaLabel}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
