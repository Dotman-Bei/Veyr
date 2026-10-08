import { describe, expect, it } from 'vitest';
import type { Post } from './genlayer';
import { CONSENSUS_STAGES, findSubmittedPost, minimumStageFor } from './submission';

const ME = '0x93Ed65c17653CC241D5297BE39eA8C94997873b1';
const OTHER = '0x1111111111111111111111111111111111111111';

const post = (index: number, author: string, text: string, approved = true): Post => ({
  index,
  author: author as `0x${string}`,
  text,
  approved,
  category: approved ? 'approved' : 'toxic',
  reason: 'r',
});

describe('findSubmittedPost', () => {
  it('finds our post even when someone else posted after it', () => {
    const posts = [post(5, OTHER, 'later post'), post(4, ME, 'hello validators', false), post(3, ME, 'older')];
    expect(findSubmittedPost(posts, ME.toLowerCase(), '  hello validators ')?.index).toBe(4);
  });

  it('ignores identical older posts from before the submission', () => {
    const posts = [post(2, ME, 'same text')];
    expect(findSubmittedPost(posts, ME, 'same text', 2)).toBeNull();
    expect(findSubmittedPost(posts, ME, 'same text', 1)?.index).toBe(2);
  });

  it('returns null when the post is not on-chain yet', () => {
    expect(findSubmittedPost([post(0, OTHER, 'x')], ME, 'x')).toBeNull();
  });
});

describe('minimumStageFor', () => {
  it('never runs ahead of the real chain status', () => {
    expect(minimumStageFor(null)).toBe(0);
    expect(minimumStageFor('PENDING')).toBe(0);
    expect(minimumStageFor('PROPOSING')).toBe(1);
    expect(minimumStageFor('COMMITTING')).toBe(3);
    expect(minimumStageFor('ACCEPTED')).toBe(CONSENSUS_STAGES.length - 1);
  });
});
