import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { txUrl } from '@/lib/config';
import type { Post } from '@/lib/genlayer';
import { cn } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';
import { CategoryBadge } from './VerdictBadge';

/** The settled verdict, exactly as read back from contract state. */
export function VerdictResult({ post, hash, onDone }: { post: Post; hash: `0x${string}`; onDone: () => void }) {
  const { config, reputation } = useVeyr();
  const href = txUrl(config, hash);
  const Icon = post.approved ? CheckCircle2 : XCircle;

  return (
    <div
      role="status"
      className={cn(
        'rounded-xl border p-5',
        post.approved ? 'border-success/40 bg-success/5' : 'border-destructive/40 bg-destructive/5',
      )}
    >
      <div className="flex items-center gap-3">
        <Icon className={cn('size-7', post.approved ? 'text-success' : 'text-destructive')} aria-hidden />
        <div>
          <div className="font-display text-2xl font-black">{post.approved ? 'Approved' : 'Rejected'}</div>
          <div className="text-xs text-muted-foreground">Consensus verdict for post #{post.index}, read from contract state</div>
        </div>
        <span className="ml-auto">
          <CategoryBadge category={post.category} />
        </span>
      </div>
      <p className="mt-4 text-sm">
        <span className="font-semibold">Reason:</span> {post.reason}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Reputation {post.approved ? '+1' : '−1'}
        {reputation.value !== null && <> · now {reputation.value > 0 ? `+${reputation.value}` : reputation.value}</>}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button size="sm" onClick={onDone}>
          Write another post
        </Button>
        <Button size="sm" variant="outline" asChild>
          <a href={`#post-${post.index}`}>See it in the feed</a>
        </Button>
        {href && (
          <Button size="sm" variant="ghost" asChild>
            <a href={href} target="_blank" rel="noreferrer">
              Transaction <ExternalLink aria-hidden />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
