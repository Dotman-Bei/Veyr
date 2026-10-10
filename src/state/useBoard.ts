import { useCallback, useEffect, useRef, useState } from 'react';
import { toVeyrError, type VeyrError } from '@/lib/errors';
import { PAGE_MAX, type BoardStats, type Post, type VeyrContract } from '@/lib/genlayer';
import { browserStorage, loadSnapshot, saveSnapshot, snapshotKey } from '@/lib/snapshot';

export interface BoardState {
  topic: string | null;
  posts: Post[];
  stats: BoardStats | null;
  loading: boolean;
  refreshing: boolean;
  error: VeyrError | null;
  updatedAt: number | null;
  /** True while showing the last-visit snapshot, before the first fresh chain read completes. */
  fromSnapshot: boolean;
  /** True when older posts exist on chain beyond those loaded. */
  hasMore: boolean;
  loadingMore: boolean;
  /** Read the next page of older posts (bounded by the contract's page cap). */
  loadMore: () => Promise<void>;
  /** Re-read the newest page and stats from chain; resolves with the fresh newest-first posts. */
  refresh: () => Promise<Post[]>;
}

/** Newest page first, then any older posts already loaded that it does not cover. */
function mergeNewest(fresh: Post[], previous: Post[]): Post[] {
  if (fresh.length < PAGE_MAX) return fresh; // the page reached the oldest post
  const oldest = fresh[fresh.length - 1].index;
  return [...fresh, ...previous.filter((p) => p.index < oldest)];
}

const AUTO_REFRESH_MS = 60_000;

/**
 * Canonical forum state, read directly from the contract. Reads stay sequential
 * (public RPC rate limits) but each result renders as soon as it arrives, and a
 * repeat visit paints the last snapshot until the fresh reads land.
 */
export function useBoard(contract: VeyrContract): BoardState {
  const key = snapshotKey(contract.config.network, contract.config.contractAddress);
  const [snapshot] = useState(() => loadSnapshot(browserStorage(), key));
  const [topic, setTopic] = useState<string | null>(snapshot?.topic ?? null);
  const [posts, setPosts] = useState<Post[]>(snapshot?.posts ?? []);
  const [stats, setStats] = useState<BoardStats | null>(snapshot?.stats ?? null);
  const [fromSnapshot, setFromSnapshot] = useState(Boolean(snapshot));
  const [loading, setLoading] = useState(!snapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<VeyrError | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const postsRef = useRef<Post[]>(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  const inFlight = useRef<Promise<Post[]> | null>(null);
  // The topic is re-read once per visit, even when a snapshot provided one.
  const topicRef = useRef<string | null>(null);

  const refresh = useCallback(() => {
    // Coalesce overlapping refreshes so the public RPC sees one sequence of reads.
    if (inFlight.current) return inFlight.current;
    const run = (async () => {
      setRefreshing(true);
      try {
        if (topicRef.current === null) {
          topicRef.current = await contract.readTopic();
          setTopic(topicRef.current);
        }
        const nextPosts = mergeNewest(await contract.readPostsPage(0), postsRef.current);
        setPosts(nextPosts);
        setLoading(false);
        const nextStats = await contract.readStats();
        setStats(nextStats);
        setFromSnapshot(false);
        setError(null);
        const now = Date.now();
        setUpdatedAt(now);
        saveSnapshot(browserStorage(), key, { topic: topicRef.current, posts: nextPosts, stats: nextStats, savedAt: now });
        return nextPosts;
      } catch (err) {
        const veyr = toVeyrError(err);
        setError(veyr);
        throw veyr;
      } finally {
        setRefreshing(false);
        setLoading(false);
        inFlight.current = null;
      }
    })();
    inFlight.current = run;
    return run;
  }, [contract, key]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const hasMore = Boolean(stats && posts.length < stats.total);
  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const older = await contract.readPostsPage(postsRef.current.length);
      setPosts((current) => {
        const seen = new Set(current.map((p) => p.index));
        return [...current, ...older.filter((p) => !seen.has(p.index))];
      });
    } catch (err) {
      setError(toVeyrError(err));
    } finally {
      setLoadingMore(false);
    }
  }, [contract, loadingMore]);

  // Gentle background refresh while the tab is visible, plus on refocus.
  useEffect(() => {
    let last = Date.now();
    const tick = () => {
      if (document.visibilityState !== 'visible' || Date.now() - last < AUTO_REFRESH_MS / 2) return;
      last = Date.now();
      refresh().catch(() => {});
    };
    const timer = window.setInterval(tick, AUTO_REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [refresh]);

  return { topic, posts, stats, loading, refreshing, error, updatedAt, fromSnapshot, hasMore, loadingMore, loadMore, refresh };
}
