import { Moon, Sun } from 'lucide-react';
import { useColorMode } from '@/hooks/useColorMode';
import { cn } from '@/lib/utils';

/** 56×30 pill switch; a transparent checkbox on top carries the accessible label. */
export function DarkModeSwitcher() {
  const { mode, toggle } = useColorMode();
  const dark = mode === 'dark';

  return (
    <label className="relative block h-[30px] w-14 shrink-0 cursor-pointer rounded-full bg-muted ring-1 ring-border">
      <input
        type="checkbox"
        checked={dark}
        onChange={toggle}
        aria-label="Toggle dark mode"
        className="peer absolute inset-0 z-10 m-0 size-full cursor-pointer opacity-0"
      />
      <span
        className={cn(
          'absolute left-[3px] top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-ring',
          dark && 'translate-x-[26px]',
        )}
      >
        <Sun
          className={cn('absolute size-4 fill-amber-400 text-amber-500 transition-opacity duration-300', dark && 'opacity-0')}
          aria-hidden
        />
        <Moon
          className={cn('absolute size-4 fill-slate-500 text-slate-600 opacity-0 transition-opacity duration-300', dark && 'opacity-100')}
          aria-hidden
        />
      </span>
    </label>
  );
}
