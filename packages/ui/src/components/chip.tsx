import * as React from 'react';
import { cn } from '../cn.js';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Capsule filter chip. Wraps the `.chip` material class from styles.css so
 * call sites stop hand-writing `<button className="chip" data-active=…>`.
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ active, className, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      data-active={active}
      aria-pressed={active}
      className={cn('chip transition-transform duration-150 active:scale-95', className)}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';

/** Horizontally scrolling chip row that bleeds to the screen edges. */
export const ChipRow = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1', className)}
    {...props}
  />
);
