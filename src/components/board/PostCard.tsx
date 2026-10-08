import { addressUrl } from '@/lib/config';
import type { Post } from '@/lib/genlayer';
import { cn, sameAddress, shortAddress } from '@/lib/utils';
import { useVeyr } from '@/state/VeyrContext';
import { Card } from '@/components/ui/card';
import { CategoryBadge, VerdictBadge } from './VerdictBadge';

export function PostCard({ post, highlight = false, className }: { post: Post; highlight?: boolean; className?: string }) {
  const { config, wallet } = useVeyr();
  const mine = sameAddress(post.author, wallet.signerAddress);
  const authorHref = addressUrl(config, post.author);

  return (
    <Card
      variant="static"
      className={cn('p-5', highlight && 'ring-2 ring-primary/40 dark:ring-secondary/50', className)}
      aria-label={`Post #${post.index}, ${post.approved ? 'approved' : 'rejected'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <VerdictBadge approved={post.approved} />
        <CategoryBadge category={post.category} />
        <span className="ml-auto flex items-center gap-2 font-mono text-xs text-muted-foreground">
          {authorHref ? (
            <a href={authorHref} target="_blank" rel="noreferrer" className="hover:text-primary dark:hover:text-secondary" title={post.author}>
              {shortAddress(post.author)}
            </a>
          ) : (
            <span title={post.author}>{shortAddress(post.author)}</span>
          )}
          {mine && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase">you</span>}
          <span aria-hidden>·</span>
          <span>#{post.index}</span>
        </span>
      </div>
      <div className={cn('mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed', !post.approved && 'text-muted-foreground')}>
        {post.text}
      </div>
      {post.reason && (
        <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Validators:</span> {post.reason}
        </p>
      )}
    </Card>
  );
}
