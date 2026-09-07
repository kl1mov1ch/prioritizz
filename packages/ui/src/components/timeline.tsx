import { cn } from '../cn.js';
import { IconCheck, IconX } from '../icons.js';

export type StepState = 'done' | 'current' | 'upcoming' | 'failed';

export interface Step {
  key: string;
  label: string;
  /** Short caption under the label, e.g. a timestamp. */
  hint?: string;
  state: StepState;
}

const DOT: Record<StepState, string> = {
  done: 'bg-tint-green text-white',
  current: 'bg-primary text-primary-foreground',
  upcoming: 'bg-grouped text-subtle',
  failed: 'bg-destructive text-destructive-foreground',
};

const LABEL: Record<StepState, string> = {
  done: 'text-foreground',
  current: 'text-foreground font-semibold',
  upcoming: 'text-subtle',
  failed: 'text-destructive font-semibold',
};

/**
 * Order progress rail. The current step pulses so the buyer can tell at a
 * glance that something is still in flight; completed steps are checked and
 * the connector fills in behind them.
 */
export function Stepper({ steps, className }: { steps: Step[]; className?: string }) {
  return (
    <ol className={cn('space-y-0', className)}>
      {steps.map((s, i) => {
        const last = i === steps.length - 1;
        const filled = s.state === 'done';
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-[11px] top-6 h-[calc(100%-1rem)] w-0.5 rounded-full transition-colors duration-300',
                  filled ? 'bg-tint-green' : 'bg-separator',
                )}
              />
            )}
            <span
              className={cn(
                'relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full transition-colors duration-300',
                DOT[s.state],
              )}
            >
              {s.state === 'done' && <IconCheck size={13} />}
              {s.state === 'failed' && <IconX size={13} />}
              {s.state === 'current' && (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-40" />
                  <span className="relative h-2 w-2 rounded-full bg-current" />
                </>
              )}
            </span>
            <span className="min-w-0 flex-1 pt-0.5">
              <span className={cn('block truncate text-subhead', LABEL[s.state])}>{s.label}</span>
              {s.hint && <span className="block truncate text-caption text-subtle">{s.hint}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export interface TimelineEntry {
  id: string;
  title: string;
  hint?: string;
  tone?: 'default' | 'success' | 'warning' | 'destructive';
}

const TONE: Record<NonNullable<TimelineEntry['tone']>, string> = {
  default: 'bg-primary',
  success: 'bg-tint-green',
  warning: 'bg-tint-orange',
  destructive: 'bg-destructive',
};

/** Append-only event history — the audit trail under the stepper. */
export function Timeline({ entries, className }: { entries: TimelineEntry[]; className?: string }) {
  return (
    <ol className={cn('relative space-y-4 border-l border-separator pl-4', className)}>
      {entries.map((e) => (
        <li key={e.id} className="relative">
          <span
            aria-hidden
            className={cn(
              'absolute -left-[21px] top-1.5 h-2 w-2 rounded-full',
              TONE[e.tone ?? 'default'],
            )}
          />
          <p className="text-footnote font-medium">{e.title}</p>
          {e.hint && <p className="text-caption text-subtle">{e.hint}</p>}
        </li>
      ))}
    </ol>
  );
}
