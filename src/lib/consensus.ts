// Patient polling of a GenLayer transaction until validator consensus settles.
//
// LLM-backed consensus takes tens of seconds to minutes, so we poll with a
// gently growing interval instead of the SDK's short default, and we treat
// every non-success terminal state as an error (never as a verdict).

import { VeyrError, contractErrorMessage, isTransient } from './errors';
import { sleep as realSleep } from './retry';

/** The subset of a genlayer-js transaction this module relies on. */
export interface ChainTransaction {
  statusName?: string;
  status?: string | number;
  txExecutionResultName?: string;
  consensus_data?: {
    leader_receipt?: Array<{
      execution_result?: string;
      result?: { status?: string; payload?: unknown } | null;
      error?: string | null;
    }>;
  };
}

export const SUCCESS_STATES = new Set(['ACCEPTED', 'FINALIZED']);
export const FAILURE_STATES = new Set(['UNDETERMINED', 'CANCELED', 'LEADER_TIMEOUT', 'VALIDATORS_TIMEOUT']);

export function statusOf(tx: ChainTransaction | null | undefined): string {
  return tx?.statusName ?? (tx?.status != null ? String(tx.status) : '');
}

/**
 * The contract error if the accepted execution failed, else null. Bradbury-style
 * RPCs set txExecutionResultName; Studionet only marks the leader receipt.
 */
export function executionError(tx: ChainTransaction): string | null {
  if (tx.txExecutionResultName === 'FINISHED_WITH_ERROR') return 'execution finished with error';
  const receipts = tx.consensus_data?.leader_receipt ?? [];
  const receipt = receipts[receipts.length - 1];
  if (!receipt) return null;
  const status = receipt.result?.status;
  if (receipt.execution_result === 'ERROR' || status === 'rollback' || status === 'error') {
    return String(receipt.result?.payload ?? receipt.error ?? 'execution failed');
  }
  return null;
}

export interface WaitOptions {
  timeoutMs?: number;
  initialIntervalMs?: number;
  maxIntervalMs?: number;
  maxLookupFailures?: number;
  onStatus?: (status: string) => void;
  signal?: AbortSignal;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export async function waitForConsensus<T extends ChainTransaction>(
  getTransaction: (hash: `0x${string}`) => Promise<T>,
  hash: `0x${string}`,
  options: WaitOptions = {},
): Promise<T> {
  const {
    timeoutMs = 10 * 60_000,
    initialIntervalMs = 3_000,
    maxIntervalMs = 8_000,
    maxLookupFailures = 8,
    onStatus,
    signal,
    sleep = realSleep,
    now = Date.now,
  } = options;

  const started = now();
  let interval = initialIntervalMs;
  let lastStatus = '';
  let lookupFailures = 0;

  while (now() - started < timeoutMs) {
    if (signal?.aborted) throw new VeyrError('canceled', 'Stopped waiting for consensus.', { txHash: hash });

    let tx: T | null = null;
    try {
      tx = await getTransaction(hash);
      lookupFailures = 0;
    } catch (err) {
      // A freshly submitted tx may not be indexed yet; rate limits are expected.
      if (!isTransient(err) && ++lookupFailures > maxLookupFailures) {
        throw new VeyrError('network', 'Could not look up the transaction status.', { cause: err, txHash: hash });
      }
    }

    const status = statusOf(tx);
    if (status && status !== lastStatus) {
      lastStatus = status;
      onStatus?.(status);
    }

    if (tx && SUCCESS_STATES.has(status)) {
      const failure = executionError(tx);
      if (failure) {
        throw new VeyrError(
          'execution',
          contractErrorMessage(failure) ?? `The contract rejected the transaction (${failure}). No verdict was recorded.`,
          { txHash: hash },
        );
      }
      return tx;
    }

    if (status === 'UNDETERMINED') {
      throw new VeyrError(
        'undetermined',
        'Validators could not agree on a verdict (UNDETERMINED). Nothing was recorded on-chain; you can try again.',
        { txHash: hash },
      );
    }
    if (status === 'CANCELED') {
      throw new VeyrError('canceled', 'The transaction was canceled before consensus. Nothing was recorded.', { txHash: hash });
    }
    if (FAILURE_STATES.has(status)) {
      throw new VeyrError('timeout', `Validators timed out (${status}). Nothing was recorded; try again shortly.`, {
        txHash: hash,
      });
    }

    await sleep(interval);
    interval = Math.min(maxIntervalMs, Math.round(interval * 1.25));
  }

  throw new VeyrError(
    'timeout',
    'Consensus is taking longer than expected. Your post may still settle: refresh the board in a minute.',
    { txHash: hash },
  );
}
