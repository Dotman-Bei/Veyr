// Shared helpers for the Node deployment and live-test scripts.
//
// Scripts read secrets from the process environment or a local .env file.
// Only GENLAYER_* / MODERATION_* / VITE_GENLAYER_* keys are ever used here.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAccount, createClient } from 'genlayer-js';
import { localnet, studionet } from 'genlayer-js/chains';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const CHAINS = { studionet, localnet };

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Minimal .env loader: ambient environment variables always win. */
export function loadDotEnv(file = join(ROOT, '.env')) {
  let raw;
  try {
    raw = readFileSync(file, 'utf-8');
  } catch {
    return;
  }
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

export function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

/** Resolve the network from VITE_GENLAYER_NETWORK (default studionet). */
export function resolveChain() {
  const name = process.env.VITE_GENLAYER_NETWORK || 'studionet';
  const chain = CHAINS[name];
  if (!chain) {
    fail(`Unsupported VITE_GENLAYER_NETWORK "${name}". Expected: ${Object.keys(CHAINS).join(', ')}.`);
  }
  return { name, chain };
}

export function requirePrivateKey() {
  const key = process.env.GENLAYER_PRIVATE_KEY;
  if (!key) fail('GENLAYER_PRIVATE_KEY is not set (environment or .env).');
  const normalized = key.startsWith('0x') ? key : `0x${key}`;
  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) fail('GENLAYER_PRIVATE_KEY must be a 32-byte hex string.');
  return normalized;
}

export function makeClient() {
  const { name, chain } = resolveChain();
  const account = createAccount(requirePrivateKey());
  const endpoint = process.env.VITE_GENLAYER_RPC_URL || undefined;
  const client = createClient({ chain, account, ...(endpoint ? { endpoint } : {}) });
  return { client, account, chain, network: name, rpcUrl: endpoint ?? chain.rpcUrls.default.http[0] };
}

const RATE_LIMITED = /rate limit|exceeds defined limit|too many requests|429/i;
const TRANSIENT = /fetch failed|ECONNRESET|ETIMEDOUT|socket hang up|502|503|504/i;

/** Retry an RPC call with linear backoff on rate limits and transient network errors. */
export async function withRetry(fn, { tries = 5, delayMs = 1500 } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const message = String(err?.message ?? err);
      const retryable = RATE_LIMITED.test(message) || TRANSIENT.test(message);
      if (!retryable || attempt >= tries) throw err;
      await sleep(delayMs * attempt);
    }
  }
}

export function read(client, address, functionName, args = []) {
  return withRetry(() => client.readContract({ address, functionName, args }));
}

const DONE = new Set(['ACCEPTED', 'FINALIZED']);
const FAILED = new Set(['UNDETERMINED', 'CANCELED', 'LEADER_TIMEOUT', 'VALIDATORS_TIMEOUT']);

/**
 * Poll a transaction until consensus is reached. LLM-backed consensus can take
 * minutes, so we poll patiently instead of using the SDK's short default.
 */
export async function waitForConsensus(client, hash, { timeoutMs = 600_000, intervalMs = 5_000, onStatus } = {}) {
  const started = Date.now();
  let last = '';
  while (Date.now() - started < timeoutMs) {
    let tx;
    try {
      tx = await client.getTransaction({ hash });
    } catch {
      await sleep(intervalMs);
      continue;
    }
    const status = tx?.statusName ?? String(tx?.status ?? '');
    if (status && status !== last) {
      last = status;
      onStatus?.(status);
    }
    if (DONE.has(status)) {
      if (tx.txExecutionResultName === 'FINISHED_WITH_ERROR') {
        const err = new Error(`transaction ${status} but execution failed`);
        err.tx = tx;
        throw err;
      }
      return tx;
    }
    if (FAILED.has(status)) {
      const err = new Error(`transaction ended ${status}`);
      err.tx = tx;
      throw err;
    }
    await sleep(intervalMs);
  }
  throw new Error(`timed out after ${Math.round(timeoutMs / 1000)}s waiting for consensus on ${hash}`);
}

export const toJson = (value) =>
  JSON.stringify(value, (_k, v) => (typeof v === 'bigint' ? v.toString() : v), 2);
