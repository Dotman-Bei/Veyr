// Typed access to the Veyr Intelligent Contract through genlayer-js.
//
// All canonical forum state (topic, posts, counts, reputation, verdicts) is
// read directly from the contract. The frontend never decides a verdict.

import { createAccount, createClient } from 'genlayer-js';
import type { AppConfig } from './config';
import { VeyrError } from './errors';
import { waitForConsensus, type ChainTransaction, type WaitOptions } from './consensus';
import { withRetry } from './retry';
import type { Eip1193Provider } from './wallet';

export const MAX_POST_CHARS = 2000;

export type Category = 'approved' | 'toxic' | 'off-topic' | 'spam' | 'other';

export interface Post {
  index: number;
  author: `0x${string}`;
  text: string;
  approved: boolean;
  category: Category;
  reason: string;
}

export interface BoardStats {
  total: number;
  approved: number;
}

type Client = ReturnType<typeof createClient>;

export type Signer =
  | { kind: 'wallet'; address: `0x${string}`; provider: Eip1193Provider }
  | { kind: 'dev-key'; privateKey: `0x${string}` };

const CATEGORIES: readonly Category[] = ['approved', 'toxic', 'off-topic', 'spam', 'other'];

const toNumber = (value: unknown): number => {
  const n = typeof value === 'bigint' ? Number(value) : Number(value);
  if (!Number.isFinite(n)) throw new VeyrError('unknown', `Unexpected numeric value from contract: ${String(value)}`);
  return n;
};

function field(record: unknown, key: string): unknown {
  if (record instanceof Map) return record.get(key);
  if (record && typeof record === 'object') return (record as Record<string, unknown>)[key];
  return undefined;
}

/** Validate one public post record returned by the contract. */
export function parsePost(record: unknown): Post {
  const author = String(field(record, 'author') ?? '');
  const category = String(field(record, 'category') ?? '');
  const approved = field(record, 'approved');
  if (!/^0x[0-9a-fA-F]{40}$/.test(author) || typeof approved !== 'boolean') {
    throw new VeyrError('unknown', 'The contract returned a malformed post record.');
  }
  return {
    index: toNumber(field(record, 'index')),
    author: author as `0x${string}`,
    text: String(field(record, 'text') ?? ''),
    approved,
    category: (CATEGORIES as readonly string[]).includes(category) ? (category as Category) : 'other',
    reason: String(field(record, 'reason') ?? ''),
  };
}

export class VeyrContract {
  readonly config: AppConfig;
  private readonly reader: Client;

  constructor(config: AppConfig) {
    this.config = config;
    // Reads need no funds; an ephemeral account only provides a `from` address.
    this.reader = createClient({ chain: config.chain, account: createAccount() });
  }

  private read(functionName: string, args: Array<string | number> = []) {
    return withRetry(() => this.reader.readContract({ address: this.config.contractAddress, functionName, args }));
  }

  async readTopic(): Promise<string> {
    return String(await this.read('get_topic'));
  }

  /** Newest-first list of every post, approved or rejected. */
  async readPosts(): Promise<Post[]> {
    const raw = await this.read('get_posts');
    if (!Array.isArray(raw)) throw new VeyrError('unknown', 'The contract returned an unexpected post list.');
    return raw.map(parsePost);
  }

  /** Sequential (not parallel) so the public RPC is not hammered. */
  async readStats(): Promise<BoardStats> {
    const total = toNumber(await this.read('get_post_count'));
    const approved = toNumber(await this.read('get_approved_count'));
    return { total, approved };
  }

  async readReputation(author: `0x${string}`): Promise<number> {
    return toNumber(await this.read('get_reputation', [author]));
  }

  private writer(signer: Signer): Client {
    if (signer.kind === 'wallet') {
      return createClient({ chain: this.config.chain, account: signer.address, provider: signer.provider });
    }
    return createClient({ chain: this.config.chain, account: createAccount(signer.privateKey) });
  }

  /** Send submit_post(text); resolves with the transaction hash once signed. */
  async submitPost(text: string, signer: Signer): Promise<`0x${string}`> {
    const trimmed = text.trim();
    if (!trimmed) throw new VeyrError('validation', 'Your post is empty. Write something first.');
    if (trimmed.length > MAX_POST_CHARS) throw new VeyrError('validation', 'Your post is longer than 2,000 characters.');

    const hash = await this.writer(signer).writeContract({
      address: this.config.contractAddress,
      functionName: 'submit_post',
      args: [trimmed],
      value: 0n,
    });
    if (typeof hash !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(hash)) {
      throw new VeyrError('unknown', 'The network did not return a transaction hash.');
    }
    return hash as `0x${string}`;
  }

  waitForConsensus(hash: `0x${string}`, options?: WaitOptions): Promise<ChainTransaction> {
    type TxHash = Parameters<Client['getTransaction']>[0]['hash'];
    return waitForConsensus(
      (h) => this.reader.getTransaction({ hash: h as TxHash }) as Promise<ChainTransaction>,
      hash,
      options,
    );
  }
}
