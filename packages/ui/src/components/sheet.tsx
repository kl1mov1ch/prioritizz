import * as React from 'react';
import { cn } from '../cn.js';
import { IconX } from '../icons.js';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Sticky action row pinned under the scrollable body. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  closeLabel?: string;
}

/**
 * Bottom sheet. Scroll is locked on the page behind it, Escape and a backdrop
 * tap dismiss, and the panel itself scrolls so a tall filter list still fits
 * on a short phone with the keyboard open.
 */
export function Sheet({
  open,
  onClose,
  title,
  footer,
  children,
  className,
  closeLabel = 'Close',
}: SheetProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Lock the page behind the sheet without losing the scroll position.
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Move focus into the sheet, and hand it back to the trigger on close.
    const restoreTo = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      restoreTo?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label={closeLabel}
        tabIndex={-1}
        className="absolute inset-0 animate-fade-in cursor-default bg-black/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'material-thick safe-b relative flex max-h-[88vh] w-full max-w-lg animate-slide-up flex-col overflow-hidden rounded-t-[20px] outline-none',
          className,
        )}
      >
        {/* Grabber — the affordance that says "this drags/dismisses". */}
        <div className="flex shrink-0 justify-center pt-2">
          <span className="h-1 w-9 rounded-full bg-separator" />
        </div>

        {title && (
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-3">
            <h2 className="truncate font-display text-title3 font-semibold">{title}</h2>
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-grouped text-muted transition-transform duration-150 active:scale-90"
            >
              <IconX size={16} />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {children}
        </div>

        {footer && <div className="shrink-0 border-t border-separator px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
