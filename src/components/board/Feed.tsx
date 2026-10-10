import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVeyr } from '@/state/VeyrContext';
import { PostCard } from './PostCard';

type Filter = 'all' | 'approved' | 'rejected';
// The public feed is approved posts only. Rejected posts are never shown by default;
// they stay on-chain, with their reason, behind the audit filters.
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];
const PAGE = 10;

function PostSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border bg-card p-5" aria-hidden>
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-full bg-muted" />
        <div className="ml-auto h-4 w-28 rounded bg-muted" />
      </div>
      <div className="mt-4 h-4 w-11/12 rounded bg-muted" />
      <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
    </div>
  );
}

/** Newest-first on-chain feed: approved by default, rejected kept for audit. */
export function Feed({ highlightIndex }: { highlightIndex?: number }) {
  const { board } = useVeyr();
  const [filter, setFilter] = useState<Filter>('approved');
  const [limit, setLimit] = useState(PAGE);

  const visible = useMemo(() => {
    if (filter === 'all') return board.posts;
    return board.posts.filter((p) => p.approved === (filter === 'approved'));
  }, [board.posts, filter]);

  const updated = board.updatedAt ? new Date(board.updatedAt).toLocaleTimeString() : null;

  return (
    <section aria-labelledby="feed-title">
      <div className="flex flex-wrap items-center gap-3">
        <h3 id="feed-title" className="mr-auto text-2xl">
          The feed
        </h3>
        <div role="group" aria-label="Filter posts" className="flex rounded-lg bg-muted p-1">
          {FILTERS.map((f) => (
            <Button
              key={f.id}
              size="sm"
              variant={filter === f.id ? 'selected' : 'ghost'}
              aria-pressed={filter === f.id}
              onClick={() => {
                setFilter(f.id);
                setLimit(PAGE);
              }}
              className="h-7 pointer-coarse:h-9"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => board.refresh().catch(() => {})} disabled={board.refreshing}>
          <RefreshCw className={board.refreshing ? 'animate-spin' : undefined} aria-hidden />
          Refresh
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
        {board.fromSnapshot
          ? 'Showing your last visit · reading fresh contract state…'
          : board.refreshing
            ? 'Reading contract state…'
            : updated
              ? `Read from chain at ${updated}`
              : ' '}
        {filter !== 'approved' && ' · Audit view: rejected posts are hidden from the public feed and kept here with their reason.'}
      </p>

      {board.error && (
        <div role="alert" className="mt-4 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <div className="flex-1">
            <div className="font-semibold">Could not read the board</div>
            <div className="text-muted-foreground">{board.error.message}</div>
          </div>
          <Button size="sm" variant="outline" onClick={() => board.refresh().catch(() => {})}>
            Retry
          </Button>
        </div>
      )}

      <div className="mt-4 space-y-4">
        {board.loading && board.posts.length === 0 ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {board.posts.length === 0 ? 'No posts yet. Be the first to face the validators.' : `No ${filter} posts yet.`}
          </div>
        ) : (
          visible.slice(0, limit).map((post) => (
            <div key={post.index} id={`post-${post.index}`} className="scroll-mt-28">
              <PostCard post={post} highlight={post.index === highlightIndex} />
            </div>
          ))
        )}
      </div>

      {visible.length > limit ? (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, visible.length - limit)} more
          </Button>
        </div>
      ) : (
        board.hasMore && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => board.loadMore()} disabled={board.loadingMore}>
              {board.loadingMore && <Loader2 className="animate-spin" aria-hidden />}
              Load older posts
            </Button>
          </div>
        )
      )}
      {board.refreshing && board.posts.length > 0 && (
        <Loader2 className="mx-auto mt-4 size-4 animate-spin text-muted-foreground" aria-hidden />
      )}
    </section>
  );
}
