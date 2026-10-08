import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Section heading rendered as h2 (frontend.md §9 heading-order fix). */
export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div className={cn('mx-auto max-w-2xl px-6 text-center', className)}>
      {eyebrow && <p className="text-sm font-semibold uppercase tracking-wider text-secondary">{eyebrow}</p>}
      <h2 id={id} className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-8 text-muted-foreground">{description}</p>}
    </div>
  );
}
