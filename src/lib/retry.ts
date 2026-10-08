// Bounded retry with exponential backoff + jitter for public RPC reads.

import { isTransient } from './errors';

export interface RetryOptions {
  tries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (err: unknown) => boolean;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    tries = 4,
    baseDelayMs = 800,
    maxDelayMs = 8_000,
    shouldRetry = isTransient,
    sleep: wait = sleep,
    random = Math.random,
  } = options;

  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= tries || !shouldRetry(err)) throw err;
      const backoff = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
      await wait(backoff / 2 + random() * (backoff / 2));
    }
  }
}
