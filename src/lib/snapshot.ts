// Last-seen board snapshot, so a repeat visit can paint immediately while the
// fresh contract reads (≈1.2s each on Studionet) are in flight. It is only a
// display cache: every visit still re-reads canonical state from the chain,
// and the UI labels snapshot data until that read completes.

import { parsePost, type BoardStats, type Post } from './genlayer';

const VERSION = 1;
const MAX_POSTS = 50;

export interface BoardSnapshot {
  topic: string;
  posts: Post[];
  stats: BoardStats;
  savedAt: number;
}

export const snapshotKey = (network: string, contract: string) => `veyr-board:${network}:${contract.toLowerCase()}`;

/** Read and validate a snapshot; anything malformed is ignored. */
export function loadSnapshot(storage: Pick<Storage, 'getItem'> | null, key: string): BoardSnapshot | null {
  try {
    const raw = storage?.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.v !== VERSION || typeof data.topic !== 'string' || !Array.isArray(data.posts)) return null;
    const total = Number(data.stats?.total);
    const approved = Number(data.stats?.approved);
    if (!Number.isInteger(total) || !Number.isInteger(approved)) return null;
    return { topic: data.topic, posts: data.posts.map(parsePost), stats: { total, approved }, savedAt: Number(data.savedAt) || 0 };
  } catch {
    return null;
  }
}

export function saveSnapshot(storage: Pick<Storage, 'setItem'> | null, key: string, snapshot: BoardSnapshot): void {
  try {
    storage?.setItem(
      key,
      JSON.stringify({ v: VERSION, ...snapshot, posts: snapshot.posts.slice(0, MAX_POSTS) }),
    );
  } catch {
    /* storage full or unavailable: the snapshot is optional */
  }
}

export function browserStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}
