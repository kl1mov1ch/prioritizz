import * as React from 'react';
import { cn } from '../cn.js';
import { IconCheck } from '../icons.js';

export interface ChatBubbleProps {
  children: React.ReactNode;
  mine?: boolean;
  /** Already-localised timestamp. */
  time?: string;
  read?: boolean;
  pending?: boolean;
}

/** One message. Outgoing bubbles are tinted and right-aligned. */
export function ChatBubble({ children, mine, time, read, pending }: ChatBubbleProps) {
  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-3 py-2 text-subhead',
          mine
            ? 'rounded-br-md bg-primary text-primary-foreground'
            : 'rounded-bl-md bg-grouped text-foreground',
          pending && 'opacity-60',
        )}
      >
        <p className="whitespace-pre-wrap break-words">{children}</p>
        {(time || mine) && (
          <span
            className={cn(
              'mt-0.5 flex items-center justify-end gap-1 text-caption2',
              mine ? 'text-primary-foreground/70' : 'text-subtle',
            )}
          >
            {time}
            {mine && !pending && (
              // Single tick = delivered, double = read.
              <span className="relative inline-flex w-3.5 items-center">
                <IconCheck size={11} className="absolute left-0" />
                {read && <IconCheck size={11} className="absolute left-1" />}
              </span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

/** Day separator inside the message list. */
export const ChatDivider = ({ label }: { label: string }) => (
  <div className="flex items-center justify-center py-1">
    <span className="rounded-full bg-grouped px-2.5 py-0.5 text-caption2 font-medium text-muted">
      {label}
    </span>
  </div>
);

/**
 * Scroll container that sticks to the newest message. `count` is the current
 * message count — the effect re-runs (and scrolls) only when it changes, not on
 * every render, so it never fights a user scrolling up to read history.
 */
export function MessageList({
  children,
  count,
  className,
}: {
  children: React.ReactNode;
  count: number;
  className?: string;
}) {
  const endRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [count]);
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      className={cn('flex flex-col gap-1.5', className)}
    >
      {children}
      <div ref={endRef} />
    </div>
  );
}
