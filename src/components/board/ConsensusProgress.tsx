import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { txUrl } from '@/lib/config';
import { CONSENSUS_STAGES } from '@/lib/submission';
import { cn, shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

function useElapsed(startedAt: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return Math.max(0, Math.floor((now - startedAt) / 1000));
}

interface Props {
  hash: `0x${string}`;
  stage: number;
  chainStatus: string | null;
  startedAt: number;
}

/** Pending-consensus panel: friendly pipeline labels plus the real tx status. */
export function ConsensusProgress({ hash, stage, chainStatus, startedAt }: Props) {
  const { config } = useVeyr();
  const elapsed = useElapsed(startedAt);
  const href = txUrl(config, hash);

  return (
    <div className="rounded-xl border bg-card-subtle p-5" role="status" aria-live="polite">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Loader2 className="size-4 animate-spin text-primary dark:text-secondary" aria-hidden />
        <span className="font-semibold">Validators are reaching consensus</span>
        <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">{elapsed}s</span>
      </div>

      <ol className="mt-4 space-y-2.5">
        {CONSENSUS_STAGES.map((label, i) => {
          const done = i < stage;
          const current = i === stage;
          return (
            <li key={label} className={cn('flex items-center gap-3 text-sm', !done && !current && 'text-muted-foreground/70')}>
              <span
                className={cn(
                  'flex size-5 shrink-0 items-center justify-center rounded-full border',
                  done && 'border-success bg-success text-background',
                  current && 'border-primary dark:border-secondary',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3" /> : current ? <span className="size-1.5 animate-pulse rounded-full bg-primary dark:bg-secondary" /> : null}
              </span>
              <span className={cn(current && 'font-semibold')}>{label}</span>
              <span className="sr-only">{done ? '(done)' : current ? '(in progress)' : ''}</span>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 grid gap-1 border-t pt-3 font-mono text-xs text-muted-foreground">
        <div>
          Transaction status: <span className="font-semibold text-foreground">{chainStatus ?? 'SUBMITTED'}</span>
        </div>
        <div>
          Tx:{' '}
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="underline-offset-2 hover:text-primary hover:underline dark:hover:text-secondary">
              {shortAddress(hash, 8)}
            </a>
          ) : (
            shortAddress(hash, 8)
          )}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        The steps above describe the consensus pipeline; the transaction status is the live value from GenLayer. This usually
        takes under a minute.
      </p>
    </div>
  );
}
