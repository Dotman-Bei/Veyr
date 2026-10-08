import { useCallback, useEffect, useRef, useState } from 'react';
import { VeyrError, toVeyrError } from '@/lib/errors';
import type { Post, Signer, VeyrContract } from '@/lib/genlayer';
import { CONSENSUS_STAGES, findSubmittedPost, minimumStageFor } from '@/lib/submission';

export type Submission =
  | { phase: 'idle' }
  | { phase: 'signing'; text: string }
  | { phase: 'pending'; text: string; hash: `0x${string}`; chainStatus: string | null; stage: number; startedAt: number }
  | { phase: 'settled'; hash: `0x${string}`; post: Post }
  | { phase: 'failed'; error: VeyrError; hash?: `0x${string}` };

interface Options {
  contract: VeyrContract;
  signer: Signer | null;
  signerAddress: `0x${string}` | null;
  prepareToSign: () => Promise<void>;
  refreshBoard: () => Promise<Post[]>;
  onSettled?: (post: Post) => void;
}

const STAGE_INTERVAL_MS = 6_000;

/**
 * Drives one submit_post transaction from signature to the on-chain verdict.
 * The verdict shown at the end is always read back from contract state.
 */
export function useSubmission({ contract, signer, signerAddress, prepareToSign, refreshBoard, onSettled }: Options) {
  const [state, setState] = useState<Submission>({ phase: 'idle' });
  const abort = useRef<AbortController | null>(null);

  // Advance the friendly stage label over time, never behind the real status.
  const pending = state.phase === 'pending';
  useEffect(() => {
    if (!pending) return;
    const timer = window.setInterval(() => {
      setState((s) =>
        s.phase === 'pending' ? { ...s, stage: Math.min(s.stage + 1, CONSENSUS_STAGES.length - 2) } : s,
      );
    }, STAGE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [pending]);

  useEffect(() => () => abort.current?.abort(), []);

  const submit = useCallback(
    async (text: string) => {
      if (!signer || !signerAddress) {
        setState({ phase: 'failed', error: new VeyrError('no-wallet', 'Connect a wallet to post.') });
        return;
      }
      const trimmed = text.trim();
      abort.current?.abort();
      const controller = new AbortController();
      abort.current = controller;
      setState({ phase: 'signing', text: trimmed });

      let hash: `0x${string}` | undefined;
      try {
        // Posts already on-chain can't be "ours" from this submission.
        const before = await refreshBoard().catch(() => [] as Post[]);
        const newestIndexBefore = before[0]?.index ?? -1;

        if (signer.kind === 'wallet') await prepareToSign();
        hash = await contract.submitPost(trimmed, signer);
        const txHash = hash;
        setState({ phase: 'pending', text: trimmed, hash: txHash, chainStatus: null, stage: 0, startedAt: Date.now() });

        await contract.waitForConsensus(txHash, {
          signal: controller.signal,
          onStatus: (status) =>
            setState((s) =>
              s.phase === 'pending' && s.hash === txHash
                ? { ...s, chainStatus: status, stage: Math.max(s.stage, minimumStageFor(status)) }
                : s,
            ),
        });

        const posts = await refreshBoard();
        const post = findSubmittedPost(posts, signerAddress, trimmed, newestIndexBefore);
        if (!post) {
          throw new VeyrError(
            'unknown',
            'Consensus finished, but your post is not visible in contract state yet. Refresh the board in a moment.',
            { txHash },
          );
        }
        if (controller.signal.aborted) return;
        setState({ phase: 'settled', hash: txHash, post });
        onSettled?.(post);
      } catch (err) {
        if (controller.signal.aborted) return;
        const error = toVeyrError(err);
        setState({ phase: 'failed', error, hash: (error.txHash as `0x${string}` | undefined) ?? hash });
      }
    },
    [contract, signer, signerAddress, prepareToSign, refreshBoard, onSettled],
  );

  const reset = useCallback(() => {
    abort.current?.abort();
    setState({ phase: 'idle' });
  }, []);

  return { state, submit, reset, busy: state.phase === 'signing' || state.phase === 'pending' };
}
