import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Layers, UserRound, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

function Stat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className={cn('size-5 text-muted-foreground', tone)} aria-hidden />
      </span>
      <div className="min-w-0">
        <div className="font-display text-2xl font-black tabular-nums leading-none">{value}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

/** Counts read from the contract (get_post_count / get_approved_count / get_reputation). */
export function StatsRow() {
  const { board, reputation, wallet } = useVeyr();
  const stats = board.stats;
  const dash = '—';
  const rep = reputation.value;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Stat label="Posts on-chain" value={stats ? String(stats.total) : dash} icon={Layers} />
      <Stat label="Approved" value={stats ? String(stats.approved) : dash} icon={CheckCircle2} tone="text-success" />
      <Stat label="Rejected" value={stats ? String(stats.total - stats.approved) : dash} icon={XCircle} tone="text-destructive" />
      <Stat
        label={wallet.signerAddress ? 'Your reputation' : 'Connect to see reputation'}
        value={rep === null ? dash : `${rep > 0 ? '+' : ''}${rep}`}
        icon={UserRound}
        tone={rep && rep > 0 ? 'text-success' : rep && rep < 0 ? 'text-destructive' : undefined}
      />
    </div>
  );
}
