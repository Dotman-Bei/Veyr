import { describe, expect, it } from 'vitest';
import { parsePost } from './genlayer';

const AUTHOR = '0x93Ed65c17653CC241D5297BE39eA8C94997873b1';

describe('parsePost', () => {
  it('accepts the contract record shape (object or Map)', () => {
    const record = { index: 1, author: AUTHOR, text: 'hi', approved: false, category: 'toxic', reason: 'Insults.' };
    expect(parsePost(record)).toEqual(record);
    expect(parsePost(new Map(Object.entries(record)))).toEqual(record);
  });

  it('coerces bigint indexes', () => {
    const post = parsePost({ index: 7n, author: AUTHOR, text: 't', approved: true, category: 'approved', reason: 'ok' });
    expect(post.index).toBe(7);
  });

  it('falls back to "other" for unknown categories', () => {
    const post = parsePost({ index: 0, author: AUTHOR, text: 't', approved: false, category: 'weird', reason: 'r' });
    expect(post.category).toBe('other');
  });

  it('rejects malformed records instead of guessing a verdict', () => {
    expect(() => parsePost({ index: 0, author: AUTHOR, text: 't', approved: 'yes', category: 'approved' })).toThrow();
    expect(() => parsePost({ index: 0, author: 'nobody', text: 't', approved: true })).toThrow();
    expect(() => parsePost(null)).toThrow();
  });
});
