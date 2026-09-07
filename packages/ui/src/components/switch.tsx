import { cn } from '../cn.js';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
  className?: string;
  id?: string;
}

/** iOS-style toggle. 51×31 is the platform metric — do not shrink it. */
export function Switch({ checked, onChange, disabled, label, className, id }: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/[0.18] disabled:opacity-40',
        checked ? 'bg-tint-green' : 'bg-grouped',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-[27px] w-[27px] rounded-full bg-white shadow-float transition-transform duration-200 ease-out',
          checked ? 'translate-x-[22px]' : 'translate-x-[2px]',
        )}
      />
    </button>
  );
}
