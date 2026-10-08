import { describe, expect, it, vi } from 'vitest';
import { withRetry } from './retry';

const noSleep = () => Promise.resolve();

describe('withRetry', () => {
  it('returns immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue(42);
    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries rate-limited calls with growing backoff', async () => {
    const delays: number[] = [];
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('429 Too Many Requests'))
      .mockRejectedValueOnce(new Error('Request exceeds defined limit'))
      .mockResolvedValue('ok');
    const result = await withRetry(fn, {
      sleep: async (ms) => void delays.push(ms),
      random: () => 1,
      baseDelayMs: 100,
    });
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([100, 200]);
  });

  it('does not retry non-transient errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('post index out of range'));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('out of range');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('gives up after the configured number of tries', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('fetch failed'));
    await expect(withRetry(fn, { tries: 3, sleep: noSleep })).rejects.toThrow('fetch failed');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('caps the delay', async () => {
    const delays: number[] = [];
    const fn = vi.fn().mockRejectedValue(new Error('429'));
    await expect(
      withRetry(fn, { tries: 6, baseDelayMs: 1000, maxDelayMs: 3000, random: () => 1, sleep: async (ms) => void delays.push(ms) }),
    ).rejects.toThrow();
    expect(Math.max(...delays)).toBe(3000);
  });
});
