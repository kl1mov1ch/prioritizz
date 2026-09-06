import * as React from 'react';
import { cn } from '../cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface treatment. Default is a translucent vibrancy material. */
  material?: 'thin' | 'regular' | 'thick' | 'solid' | 'grouped';
  /** Drop the built-in padding. */
  flush?: boolean;
}

const SURFACE: Record<NonNullable<CardProps['material']>, string> = {
  thin: 'material-thin',
  regular: 'material',
  thick: 'material-thick',
  solid: 'bg-elevated',
  grouped: 'bg-grouped',
};

/**
 * Content surface. Material over the page gradient, radius 16, no border and
 * no drop-shadow — depth reads from translucency and the inner top highlight.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, material = 'regular', flush, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl text-foreground',
        SURFACE[material],
        !flush && 'p-4 md:p-5',
        className,
      )}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mb-3 flex flex-col gap-1', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('font-display text-title3 font-semibold', className)} {...props} />
);

export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-subhead text-muted', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('mt-4 flex items-center gap-3', className)} {...props} />
);

/** Apple inset grouped list. Rows are separated by hairlines, never bordered. */
export const GroupedList = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grouped', className)} {...props} />
);

export const GroupedRow = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('grouped-row', className)} {...props} />
);
