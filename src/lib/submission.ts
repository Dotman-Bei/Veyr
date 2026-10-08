// Pure helpers for the post submission flow.

import type { Post } from './genlayer';
import { sameAddress } from './utils';

/**
 * Friendly progress labels shown while consensus runs. They describe the
 * logical pipeline only; the real chain status is shown separately.
 */
export const CONSENSUS_STAGES = [
  'Opening validator session',
  'Reading the submission',
  'Checking the board policy',
  'Comparing validator decisions',
  'Writing the result on-chain',
] as const;

/** Map the real transaction status to the furthest logical stage it implies. */
export function minimumStageFor(chainStatus: string | null): number {
  switch (chainStatus) {
    case 'PROPOSING':
      return 1;
    case 'COMMITTING':
    case 'REVEALING':
      return 3;
    case 'ACCEPTED':
    case 'FINALIZED':
      return 4;
    default:
      return 0;
  }
}

/**
 * The newest on-chain post by `author` with exactly this text. Searching (not
 * just taking posts[0]) keeps the verdict correct if someone else posted
 * while our transaction was settling. Only posts newer than `minIndex` count.
 */
export function findSubmittedPost(posts: Post[], author: string, text: string, minIndex = -1): Post | null {
  const trimmed = text.trim();
  return (
    posts.find((post) => post.index > minIndex && sameAddress(post.author, author) && post.text === trimmed) ?? null
  );
}
