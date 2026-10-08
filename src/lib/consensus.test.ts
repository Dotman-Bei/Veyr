import { describe, expect, it, vi } from 'vitest';
import { VeyrError } from './errors';
import { executionError, waitForConsensus, type ChainTransaction } from './consensus';

const HASH = `0x${'ab'.repeat(32)}` as const;

/** Build a fake getTransaction that walks through the given transactions. */
function sequence(...txs: Array<ChainTransaction | Error>) {
  let i = 0;
  return vi.fn(async () => {
    const next = txs[Math.min(i++, txs.length - 1)];
    if (next instanceof Error) throw next;
    return next;
  });
}

function clock() {
  let t = 0;
  return { now: () => t, sleep: async (ms: number) => void (t += ms) };
}

const ok = { execution_result: 'SUCCESS', result: { status: 'return', payload: {} } };

describe('waitForConsensus', () => {
  it('resolves once the transaction is ACCEPTED and reports each status once', async () => {
    const statuses: string[] = [];
    const get = sequence(
      { statusName: 'PENDING' },
      { statusName: 'PROPOSING' },
      { statusName: 'PROPOSING' },
      { statusName: 'COMMITTING' },
      { statusName: 'ACCEPTED', consensus_data: { leader_receipt: [ok] } },
    );
    const tx = await waitForConsensus(get, HASH, { ...clock(), onStatus: (s) => statuses.push(s) });
    expect(tx.statusName).toBe('ACCEPTED');
    expect(statuses).toEqual(['PENDING', 'PROPOSING', 'COMMITTING', 'ACCEPTED']);
  });

  it('accepts FINALIZED as success', async () => {
    const tx = await waitForConsensus(sequence({ statusName: 'FINALIZED' }), HASH, clock());
    expect(tx.statusName).toBe('FINALIZED');
  });

  it.each([
    ['UNDETERMINED', 'undetermined'],
    ['CANCELED', 'canceled'],
    ['LEADER_TIMEOUT', 'timeout'],
    ['VALIDATORS_TIMEOUT', 'timeout'],
  ])('fails on %s without producing a verdict', async (status, kind) => {
    const err = await waitForConsensus(sequence({ statusName: 'PENDING' }, { statusName: status }), HASH, clock()).catch(
      (e) => e,
    );
    expect(err).toBeInstanceOf(VeyrError);
    expect(err.kind).toBe(kind);
    expect(err.txHash).toBe(HASH);
  });

  it('treats an ACCEPTED rollback as an execution error', async () => {
    const rollback = { execution_result: 'ERROR', result: { status: 'rollback', payload: 'post text too long (max 2000 chars)' } };
    const err = await waitForConsensus(
      sequence({ statusName: 'ACCEPTED', consensus_data: { leader_receipt: [rollback] } }),
      HASH,
      clock(),
    ).catch((e) => e);
    expect(err.kind).toBe('execution');
    expect(err.message).toMatch(/2,000/);
  });

  it('rides out transient lookup failures', async () => {
    const get = sequence(new Error('429 Too Many Requests'), new Error('fetch failed'), { statusName: 'ACCEPTED' });
    await expect(waitForConsensus(get, HASH, clock())).resolves.toMatchObject({ statusName: 'ACCEPTED' });
  });

  it('gives up after repeated non-transient lookup failures', async () => {
    const get = sequence(new Error('transaction not found'));
    const err = await waitForConsensus(get, HASH, { ...clock(), maxLookupFailures: 2 }).catch((e) => e);
    expect(err.kind).toBe('network');
    expect(get).toHaveBeenCalledTimes(3);
  });

  it('times out with a refresh hint', async () => {
    const err = await waitForConsensus(sequence({ statusName: 'PENDING' }), HASH, { ...clock(), timeoutMs: 20_000 }).catch(
      (e) => e,
    );
    expect(err.kind).toBe('timeout');
    expect(err.message).toMatch(/refresh/i);
  });

  it('polls patiently with a growing, capped interval', async () => {
    const delays: number[] = [];
    let t = 0;
    const get = sequence(...Array.from({ length: 12 }, () => ({ statusName: 'PENDING' })), { statusName: 'ACCEPTED' });
    await waitForConsensus(get, HASH, {
      now: () => t,
      sleep: async (ms) => {
        delays.push(ms);
        t += ms;
      },
    });
    expect(delays[0]).toBe(3000);
    expect(delays.every((d, i) => i === 0 || d >= delays[i - 1])).toBe(true);
    expect(Math.max(...delays)).toBe(8000);
  });

  it('stops when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const err = await waitForConsensus(sequence({ statusName: 'PENDING' }), HASH, { ...clock(), signal: controller.signal }).catch(
      (e) => e,
    );
    expect(err.kind).toBe('canceled');
  });
});

describe('executionError', () => {
  it('reads Studionet leader receipts and Bradbury result names', () => {
    expect(executionError({ consensus_data: { leader_receipt: [ok] } })).toBeNull();
    expect(
      executionError({ consensus_data: { leader_receipt: [{ execution_result: 'ERROR', result: { status: 'rollback', payload: 'nope' } }] } }),
    ).toBe('nope');
    expect(executionError({ txExecutionResultName: 'FINISHED_WITH_ERROR' })).toMatch(/error/);
    expect(executionError({})).toBeNull();
  });
});
