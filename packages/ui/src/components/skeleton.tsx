import * as React from 'react';
import { cn } from '../cn.js';

/**
 * Placeholder block for content-shaped loading. Prefer this over a centred
 * spinner for lists and cards — it keeps layout stable and avoids the jump
 * when data lands.
 */
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div aria-hidden className={cn('animate-pulse rounded-lg bg-grouped', className)} {...props} />
);

/** Matches the catalog card silhouette so the swap to real data is invisible. */
export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('material rounded-2xl p-4 md:p-5', className)}>
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-10" />
      </div>
    </div>
  </div>
);

export const SkeletonList = ({ count = 4, className }: { count?: number; className?: string }) => (
  <div className={cn('space-y-3', className)}>
    {Array.from({ length: count }, (_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);
