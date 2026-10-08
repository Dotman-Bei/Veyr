import { AlertTriangle, KeyRound, Loader2, LogOut, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn, shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';

export function ReputationPill({ value, className }: { value: number | null; className?: string }) {
  if (value === null) return null;
  const tone = value > 0 ? 'text-success' : value < 0 ? 'text-destructive' : 'text-muted-foreground';
  return (
    <span className={cn('font-mono text-xs font-semibold tabular-nums', tone, className)} title="On-chain reputation">
      {value > 0 ? '+' : ''}
      {value} rep
    </span>
  );
}

/** Connect / switch-network / connected-account control. */
export function WalletButton({ compact = false, className }: { compact?: boolean; className?: string }) {
  const { wallet, reputation, config } = useVeyr();

  const connect = () =>
    wallet.connect().catch((err) => toast.error(err.message ?? 'Could not connect your wallet.'));
  const switchNetwork = () =>
    wallet.switchNetwork().catch((err) => toast.error(err.message ?? 'Could not switch networks.'));

  if (wallet.account && wallet.wrongNetwork) {
    return (
      <Button variant="outline" size="sm" onClick={switchNetwork} className={cn('border-warning/50 text-warning', className)}>
        <AlertTriangle aria-hidden />
        Switch to {config.networkLabel.replace('GenLayer ', '')}
      </Button>
    );
  }

  if (wallet.account) {
    return (
      <div className={cn('flex items-center gap-1 rounded-full border bg-background/60 py-1 pl-3 pr-1', className)}>
        <span className="font-mono text-xs" title={wallet.account}>
          {shortAddress(wallet.account)}
        </span>
        <ReputationPill value={reputation.value} className="ml-1" />
        <Button variant="ghost" size="icon" className="size-7 rounded-full" onClick={wallet.disconnect}>
          <LogOut aria-hidden />
          <span className="sr-only">Disconnect wallet</span>
        </Button>
      </div>
    );
  }

  if (!wallet.hasWallet) {
    if (wallet.signerAddress) {
      return (
        <span
          className={cn('flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs', className)}
          title="Signing with VITE_GENLAYER_ACCOUNT_PRIVATE_KEY (development only)"
        >
          <KeyRound className="size-3.5" aria-hidden /> dev {shortAddress(wallet.signerAddress)}
        </span>
      );
    }
    return (
      <Button variant="outline" size="sm" asChild className={className}>
        <a href="https://metamask.io/download/" target="_blank" rel="noreferrer">
          <Wallet aria-hidden />
          {compact ? 'Get a wallet' : 'Install a wallet'}
        </a>
      </Button>
    );
  }

  return (
    <Button size="sm" onClick={connect} disabled={wallet.connecting} className={className}>
      {wallet.connecting ? <Loader2 className="animate-spin" aria-hidden /> : <Wallet aria-hidden />}
      {wallet.connecting ? 'Connecting…' : 'Connect wallet'}
    </Button>
  );
}
