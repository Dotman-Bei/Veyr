import { cn } from '@/lib/utils';

/** Veyr mark: two validator strokes converging on one decision point. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={cn('size-8', className)}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path
        d="M8 9.5 16 22.5 24 9.5"
        className="stroke-primary-foreground"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="9.5" r="2.2" className="fill-primary-foreground" />
      <circle cx="24" cy="9.5" r="2.2" className="fill-primary-foreground" />
      <circle cx="16" cy="22.5" r="3" className="fill-secondary" />
    </svg>
  );
}
