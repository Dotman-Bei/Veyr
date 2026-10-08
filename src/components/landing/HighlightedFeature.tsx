import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  id?: string;
  name: ReactNode;
  description: ReactNode;
  visual: ReactNode;
  direction?: 'row' | 'row-reverse';
  tilt?: 'left' | 'right';
  className?: string;
}

/** Alternating text/visual feature row (frontend.md §6.3). */
export function HighlightedFeature({ id, name, description, visual, direction = 'row', tilt, className }: Props) {
  return (
    <div
      id={id}
      className={cn(
        'mx-auto flex max-w-6xl scroll-mt-24 flex-col items-center justify-between gap-x-20 gap-y-10 px-8 transition-all duration-300 md:px-4',
        direction === 'row' ? 'md:flex-row' : 'md:flex-row-reverse',
        className,
      )}
    >
      <div className="flex-1">
        <h3 className="mb-4 text-4xl font-bold">{name}</h3>
        <div className="space-y-4 text-muted-foreground">{description}</div>
      </div>
      <div className={cn('w-full flex-1', tilt === 'left' && 'md:-rotate-1', tilt === 'right' && 'md:rotate-1')}>{visual}</div>
    </div>
  );
}
