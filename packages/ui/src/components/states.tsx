import * as React from 'react';
import { cn } from '../cn.js';
import { IconSpinner, IconAlert, IconSearch } from '../icons.js';

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <IconSpinner size={size} className={cn('text-primary', className)} />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted">
      <Spinner size={22} />
      <span className="text-subhead">{label}</span>
    </div>
  );
}

function Medallion({ children, tone }: { children: React.ReactNode; tone?: 'red' }) {
  return (
    <span
      className={cn(
        'grid h-11 w-11 place-items-center rounded-2xl',
        tone === 'red' ? 'bg-tint-red/[0.12] text-tint-red' : 'bg-grouped text-subtle',
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="material flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-14 text-center">
      <Medallion>{icon ?? <IconSearch size={22} />}</Medallion>
      <p className="mt-1 text-body font-semibold">{title}</p>
      {description && <p className="max-w-sm text-subhead text-muted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Retry',
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="material flex flex-col items-center justify-center gap-2 rounded-2xl px-6 py-14 text-center">
      <Medallion tone="red">
        <IconAlert size={22} />
      </Medallion>
      <p className="mt-1 text-body font-semibold">{title}</p>
      {description && <p className="max-w-sm text-subhead text-muted">{description}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 min-h-dense rounded-lg px-4 py-1.5 text-subhead font-semibold text-primary transition-colors hover:bg-primary/[0.08]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
