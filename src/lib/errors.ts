// Turns wallet, RPC and consensus failures into clear, user-facing messages.
//
// Nothing here ever produces a verdict: an error is always surfaced as an
// error, never converted into an approval or rejection.

export type ErrorKind =
  | 'config'
  | 'no-wallet'
  | 'user-rejected'
  | 'wrong-network'
  | 'account-changed'
  | 'validation'
  | 'undetermined'
  | 'canceled'
  | 'timeout'
  | 'execution'
  | 'rate-limit'
  | 'network'
  | 'unknown';

export class VeyrError extends Error {
  readonly kind: ErrorKind;
  readonly txHash?: string;

  constructor(kind: ErrorKind, message: string, options?: { cause?: unknown; txHash?: string }) {
    super(message, { cause: options?.cause });
    this.name = 'VeyrError';
    this.kind = kind;
    this.txHash = options?.txHash;
  }
}

const RATE_LIMIT = /rate limit|exceeds defined limit|too many requests|\b429\b/i;
const NETWORK = /failed to fetch|fetch failed|networkerror|load failed|econnreset|etimedout|socket hang up|\b50[234]\b/i;

/** Contract UserErrors we know how to explain. */
const CONTRACT_ERRORS: Array<[RegExp, string]> = [
  [/post text cannot be empty/i, 'Your post is empty. Write something first.'],
  [/post text too long/i, 'Your post is longer than 2,000 characters.'],
  [/post index out of range/i, 'That post does not exist.'],
  [/author suspended/i, 'Your account is suspended after repeated rejections. Try again when the suspension ends.'],
  [/cooldown/i, 'You are posting too fast. Wait a minute between posts.'],
  [/duplicate post/i, 'That exact text was already submitted. Duplicates are refused.'],
  [/invalid address/i, 'That is not a valid address.'],
  [/invalid decision|did not return JSON|malformed JSON|unsupported payload|non-object payload/i,
    'The moderators returned an invalid response, so no verdict was recorded. Try again.'],
];

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err && 'message' in err) return String((err as { message: unknown }).message);
  return String(err);
}

function codeOf(err: unknown): number | undefined {
  const anyErr = err as { code?: unknown; cause?: { code?: unknown } } | null;
  const code = anyErr?.code ?? anyErr?.cause?.code;
  return typeof code === 'number' ? code : undefined;
}

export function isRateLimited(err: unknown): boolean {
  return codeOf(err) === 429 || RATE_LIMIT.test(messageOf(err));
}

export function isTransient(err: unknown): boolean {
  return isRateLimited(err) || NETWORK.test(messageOf(err));
}

export function contractErrorMessage(raw: string): string | null {
  for (const [pattern, friendly] of CONTRACT_ERRORS) {
    if (pattern.test(raw)) return friendly;
  }
  return null;
}

export function toVeyrError(err: unknown): VeyrError {
  if (err instanceof VeyrError) return err;
  const message = messageOf(err);
  const code = codeOf(err);

  // EIP-1193: 4001 user rejected, 4100 unauthorized.
  if (code === 4001 || /user (rejected|denied)|rejected the request|request rejected/i.test(message)) {
    return new VeyrError('user-rejected', 'You rejected the request in your wallet.', { cause: err });
  }
  if (code === 4100) {
    return new VeyrError('user-rejected', 'Your wallet has not authorized this site. Connect again.', { cause: err });
  }
  if (/wallet is on chain|wrong network|chain mismatch/i.test(message)) {
    return new VeyrError('wrong-network', 'Your wallet is on the wrong network. Switch to GenLayer Studionet.', { cause: err });
  }
  if (isRateLimited(err)) {
    return new VeyrError('rate-limit', 'The GenLayer RPC is rate-limiting requests. Wait a moment and try again.', { cause: err });
  }
  if (NETWORK.test(message)) {
    return new VeyrError('network', 'Could not reach the GenLayer RPC. Check your connection and try again.', { cause: err });
  }
  const contract = contractErrorMessage(message);
  if (contract) return new VeyrError('validation', contract, { cause: err });

  return new VeyrError('unknown', message || 'Something went wrong.', { cause: err });
}
