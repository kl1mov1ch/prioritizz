import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';
import { IconSpinner } from '../icons.js';

/**
 * Apple button roles. One system tint per surface — `primary` is the app tint
 * (blue); semantic tints are reserved for status, not for competing actions.
 * No drop-shadows: depth comes from material layering.
 */
const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-sans font-semibold tracking-[-0.012em] transition-[background,color,opacity,transform] duration-150 ease-out active:scale-[0.975] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/[0.18] disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/85',
        bordered:
          'border border-primary bg-transparent text-primary hover:bg-primary/[0.08] active:bg-primary/[0.12]',
        material:
          'material text-foreground hover:bg-[rgb(var(--material-thick))] active:bg-[rgb(var(--material-thick))]',
        grouped: 'bg-grouped text-foreground hover:brightness-[0.97] active:brightness-95',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/85',
        plain: 'bg-transparent text-primary hover:bg-primary/[0.07] active:bg-primary/[0.12]',
        link: 'bg-transparent p-0 text-primary underline-offset-[3px] hover:underline',
      },
      size: {
        sm: 'min-h-dense rounded-[10px] px-3 text-footnote',
        default: 'min-h-touch rounded-lg px-5 py-2.5 text-body md:min-h-[36px] md:text-subhead',
        lg: 'min-h-[52px] rounded-[14px] px-6 text-title3',
        icon: 'h-11 w-11 rounded-lg md:h-9 md:w-9',
        block: 'min-h-touch w-full rounded-lg px-5 py-3 text-body',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'color'>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <IconSpinner size={17} />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/** Square control for toolbars — frosted material, never shadowed. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'material' | 'plain' }
>(({ className, label, tone = 'material', children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-foreground transition-[background,transform] duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/[0.18]',
      tone === 'material' ? 'material' : 'hover:bg-grouped',
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = 'IconButton';

export { buttonVariants };
