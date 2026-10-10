import { describe, expect, it } from 'vitest';
import { VeyrError, contractErrorMessage, isRateLimited, isTransient, toVeyrError } from './errors';

describe('toVeyrError', () => {
  it('detects wallet rejections by EIP-1193 code and message', () => {
    expect(toVeyrError({ code: 4001, message: 'whatever' }).kind).toBe('user-rejected');
    expect(toVeyrError(new Error('User rejected the request.')).kind).toBe('user-rejected');
    expect(toVeyrError({ code: 4100, message: 'unauthorized' }).kind).toBe('user-rejected');
  });

  it('detects wrong-network errors from genlayer-js', () => {
    const err = new Error('Wallet is on chain 1 but client is configured for chain 61999');
    expect(toVeyrError(err).kind).toBe('wrong-network');
  });

  it('classifies rate limiting and transient network failures', () => {
    expect(toVeyrError(new Error('Request exceeds defined limit')).kind).toBe('rate-limit');
    expect(toVeyrError({ code: 429, message: 'slow down' }).kind).toBe('rate-limit');
    expect(toVeyrError(new TypeError('Failed to fetch')).kind).toBe('network');
  });

  it('explains known contract validation errors', () => {
    expect(toVeyrError(new Error('UserError: post text too long (max 2000 chars)')).message).toMatch(/2,000/);
    expect(toVeyrError(new Error('post text cannot be empty')).kind).toBe('validation');
  });

  it('passes VeyrErrors through untouched', () => {
    const original = new VeyrError('timeout', 'slow');
    expect(toVeyrError(original)).toBe(original);
  });

  it('never produces a verdict-like kind for unknown errors', () => {
    expect(toVeyrError('boom').kind).toBe('unknown');
    expect(toVeyrError(undefined).message.length).toBeGreaterThan(0);
  });
});

describe('helpers', () => {
  it('flags retryable errors', () => {
    expect(isRateLimited(new Error('429 Too Many Requests'))).toBe(true);
    expect(isTransient(new Error('fetch failed'))).toBe(true);
    expect(isTransient(new Error('post text too long'))).toBe(false);
  });

  it('maps malformed moderator output to a no-verdict message', () => {
    expect(contractErrorMessage('invalid decision from moderator')).toMatch(/no verdict was recorded/);
    expect(contractErrorMessage('author suspended until 1791000000 (reputation too low)')).toMatch(/suspended/);
    expect(contractErrorMessage('cooldown: wait 42s before posting again')).toMatch(/too fast/);
    expect(contractErrorMessage('duplicate post: identical text was already submitted')).toMatch(/already submitted/);
    expect(contractErrorMessage('something else')).toBeNull();
  });
});
