import { useCallback, useEffect, useRef, useState } from 'react';
import { toVeyrError, type VeyrError } from '@/lib/errors';
import type { BoardStats, Post, VeyrContract } from '@/lib/genlayer';
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
  /** Re-read posts and stats from chain; resolves with the fresh newest-first posts. */
  refresh: () => Promise<Post[]>;
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
        const nextPosts = await contract.readPosts();
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

  return { topic, posts, stats, loading, refreshing, error, updatedAt, fromSnapshot, refresh };
}
