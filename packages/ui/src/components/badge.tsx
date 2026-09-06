import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../cn.js';

/**
 * Status pill. Tinted fills stay at low alpha so a badge never competes with
 * the surface's primary tint.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-[3px] text-caption font-semibold tracking-[-0.004em]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        secondary: 'bg-grouped text-foreground/80',
        outline: 'border border-separator text-muted',
        destructive: 'bg-tint-red/[0.14] text-tint-red',
        success: 'bg-tint-green/[0.16] text-tint-green',
        warning: 'bg-tint-orange/[0.16] text-tint-orange',
        info: 'bg-tint-blue/[0.14] text-tint-blue',
        purple: 'bg-tint-purple/[0.14] text-tint-purple',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
