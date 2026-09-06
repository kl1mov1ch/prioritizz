import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';
import { IconSpinner } from '../icons.js';

const buttonVariants = cva(
  'relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold tracking-[0.01em] transition-[transform,box-shadow,background,color] duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-55',
  {
    variants: {
      variant: {
        default:
          'text-primary-foreground bg-brand-gradient shadow-glow hover:brightness-[1.06]',
        glass:
          'glass text-foreground hover:bg-[hsl(var(--glass-bg-strong))]',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_10px_28px_-12px_hsl(var(--destructive)/0.7)] hover:brightness-105',
        outline:
          'border border-[hsl(var(--glass-hairline))] bg-transparent hover:bg-[hsl(var(--glass-bg))] hover:backdrop-blur-md',
        ghost: 'hover:bg-[hsl(var(--glass-bg))] hover:backdrop-blur-md',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 rounded-lg px-3.5 text-[0.8rem]',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
        block: 'h-12 w-full px-5',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <IconSpinner size={17} />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

/** Square frosted icon button. */
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(({ className, label, children, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      'glass inline-flex h-10 w-10 items-center justify-center rounded-xl text-foreground transition-[transform,background] duration-150 active:scale-90 hover:bg-[hsl(var(--glass-bg-strong))] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
      className,
    )}
    {...props}
  >
    {children}
  </button>
));
IconButton.displayName = 'IconButton';

export { buttonVariants };
