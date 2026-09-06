import * as React from 'react';
import { cn } from '../cn.js';
import { IconSpinner, IconAlert, IconSearch } from '../icons.js';

export function Spinner({ className, size = 20 }: { className?: string; size?: number }) {
  return <IconSpinner size={size} className={cn('text-primary', className)} />;
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-muted-foreground animate-fade-up">
      <Spinner size={24} />
      <span className="text-sm">{label}</span>
    </div>
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
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl border-dashed px-6 py-14 text-center animate-fade-up">
      <span className="mb-1 grid h-11 w-11 place-items-center rounded-2xl bg-[hsl(var(--glass-bg))] text-muted-foreground">
        {icon ?? <IconSearch size={22} />}
      </span>
      <p className="font-semibold">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
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
    <div className="glass flex flex-col items-center justify-center gap-2 rounded-2xl border-destructive/25 px-6 py-14 text-center animate-fade-up">
      <span className="mb-1 grid h-11 w-11 place-items-center rounded-2xl bg-destructive/15 text-destructive">
        <IconAlert size={22} />
      </span>
      <p className="font-semibold text-destructive">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 rounded-xl border border-[hsl(var(--glass-hairline))] bg-[hsl(var(--glass-bg))] px-4 py-1.5 text-sm font-medium backdrop-blur-md transition-colors hover:bg-[hsl(var(--glass-bg-strong))]"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
