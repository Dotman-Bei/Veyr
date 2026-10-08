import { useCallback, useEffect, useRef, useState } from 'react';
import { toVeyrError, type VeyrError } from '@/lib/errors';
import type { BoardStats, Post, VeyrContract } from '@/lib/genlayer';

export interface BoardState {
  topic: string | null;
  posts: Post[];
  stats: BoardStats | null;
  loading: boolean;
  refreshing: boolean;
  error: VeyrError | null;
  updatedAt: number | null;
  /** Re-read posts and stats from chain; resolves with the fresh newest-first posts. */
  refresh: () => Promise<Post[]>;
}

const AUTO_REFRESH_MS = 60_000;

/** Canonical forum state, read directly from the contract (no backend, no cache). */
export function useBoard(contract: VeyrContract): BoardState {
  const [topic, setTopic] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<BoardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<VeyrError | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const inFlight = useRef<Promise<Post[]> | null>(null);
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
        const nextPosts = await contract.readPosts();
        const nextStats = await contract.readStats();
        setPosts(nextPosts);
        setStats(nextStats);
        setError(null);
        setUpdatedAt(Date.now());
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
  }, [contract]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

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

  return { topic, posts, stats, loading, refreshing, error, updatedAt, refresh };
}
