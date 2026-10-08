import { addressUrl } from '@/lib/config';
import { useVeyr } from '@/state/VeyrContext';

/** Landing announcement. Ink text on a light gradient keeps contrast AA in both modes. */
export function Announcement() {
  const { config } = useVeyr();
  const href = addressUrl(config, config.contractAddress);
  const network = config.network === 'studionet' ? 'GenLayer Studionet' : config.chain.name;

  return (
    <div className="flex items-center justify-center gap-3 bg-linear-to-r from-accent to-secondary-muted p-3 text-center text-sm font-semibold text-accent-foreground">
      <span className="hidden lg:inline">Live on {network}: every verdict is settled by validator consensus</span>
      <span className="hidden h-4 w-0.5 bg-accent-foreground/25 lg:block" aria-hidden />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-background/40 px-2.5 py-1 text-xs transition-colors hover:bg-background/60"
        >
          <span className="lg:hidden">Live on {network} · </span>View the contract <span aria-hidden>→</span>
        </a>
      ) : (
        <span className="rounded-full bg-background/40 px-2.5 py-1 text-xs lg:hidden">Live on {network}</span>
      )}
    </div>
  );
}
