import { describe, expect, it } from 'vitest';
import { loadSnapshot, saveSnapshot, snapshotKey, type BoardSnapshot } from './snapshot';

const AUTHOR = '0x93Ed65c17653CC241D5297BE39eA8C94997873b1';
const snap: BoardSnapshot = {
  topic: 'GenLayer and blockchain development',
  posts: [{ index: 0, author: AUTHOR, text: 'hi', approved: true, category: 'approved', reason: 'ok' }],
  stats: { total: 1, approved: 1 },
  savedAt: 123,
};

function memory() {
  const map = new Map<string, string>();
  return { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), map };
}

describe('board snapshot', () => {
  it('round-trips through storage', () => {
    const store = memory();
    saveSnapshot(store, 'k', snap);
    expect(loadSnapshot(store, 'k')).toEqual(snap);
  });

  it('is keyed per network and contract, case-insensitively', () => {
    expect(snapshotKey('studionet', '0xABC')).toBe(snapshotKey('studionet', '0xabc'));
    expect(snapshotKey('studionet', '0xabc')).not.toBe(snapshotKey('localnet', '0xabc'));
  });

  it('ignores malformed or foreign data instead of trusting it', () => {
    const store = memory();
    for (const bad of ['not json', '{"v":99}', JSON.stringify({ v: 1, topic: 't', posts: [{ approved: 'yes' }], stats: { total: 1, approved: 0 } })]) {
      store.map.set('k', bad);
      expect(loadSnapshot(store, 'k')).toBeNull();
    }
    expect(loadSnapshot(store, 'missing')).toBeNull();
  });

  it('survives unavailable or throwing storage', () => {
    const throwing = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('quota'); } };
    expect(loadSnapshot(throwing, 'k')).toBeNull();
    expect(() => saveSnapshot(throwing, 'k', snap)).not.toThrow();
    expect(loadSnapshot(null, 'k')).toBeNull();
  });
});
