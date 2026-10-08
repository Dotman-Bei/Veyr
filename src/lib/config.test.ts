import { describe, expect, it } from 'vitest';
import * as sdkChains from 'genlayer-js/chains';
import { studionet } from 'genlayer-js/chains';
import { NETWORKS, addressUrl, parseConfig, txUrl } from './config';

const ADDRESS = '0xC1C38084e9bf9f0A3a7016fA0470b5E4c436bEE3';

describe('parseConfig', () => {
  it('defaults to studionet with the official RPC', () => {
    const result = parseConfig({ VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.network).toBe('studionet');
    expect(result.config.chain.id).toBe(61999);
    expect(result.config.rpcUrl).toBe('https://studio.genlayer.com/api');
    expect(result.config.rpcOverridden).toBe(false);
    expect(result.config.devPrivateKey).toBeNull();
    expect(addressUrl(result.config, ADDRESS)).toBe(`https://explorer-studio.genlayer.com/address/${ADDRESS}`);
    expect(txUrl(result.config, '0xabc')).toBe('https://explorer-studio.genlayer.com/tx/0xabc');
  });

  it('reports a missing contract address', () => {
    const result = parseConfig({ VITE_GENLAYER_NETWORK: 'studionet' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.join(' ')).toMatch(/Missing VITE_GENLAYER_CONTRACT_ADDRESS/);
  });

  it('rejects a malformed contract address', () => {
    const result = parseConfig({ VITE_GENLAYER_CONTRACT_ADDRESS: '0x1234' });
    expect(result.ok).toBe(false);
  });

  it('rejects unknown networks, including studio-dev', () => {
    for (const network of ['studio-dev', 'mainnet', 'nope']) {
      const result = parseConfig({ VITE_GENLAYER_NETWORK: network, VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS });
      expect(result.ok).toBe(false);
      if (result.ok) continue;
      expect(result.errors[0]).toMatch(/Unsupported VITE_GENLAYER_NETWORK/);
    }
  });

  it('accepts an http(s) RPC override without mutating the shared chain', () => {
    const result = parseConfig({
      VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS,
      VITE_GENLAYER_RPC_URL: 'https://rpc.example.com/api',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.config.rpcUrl).toBe('https://rpc.example.com/api');
    expect(result.config.rpcOverridden).toBe(true);
    expect(studionet.rpcUrls.default.http[0]).toBe('https://studio.genlayer.com/api');
  });

  it('rejects an invalid RPC override', () => {
    for (const rpc of ['not a url', 'ftp://example.com', 'ws://example.com']) {
      const result = parseConfig({ VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS, VITE_GENLAYER_RPC_URL: rpc });
      expect(result.ok).toBe(false);
    }
  });

  it('normalizes an optional dev key and rejects malformed ones', () => {
    const key = 'a'.repeat(64);
    const ok = parseConfig({ VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS, VITE_GENLAYER_ACCOUNT_PRIVATE_KEY: key });
    expect(ok.ok && ok.config.devPrivateKey).toBe(`0x${key}`);

    const bad = parseConfig({ VITE_GENLAYER_CONTRACT_ADDRESS: ADDRESS, VITE_GENLAYER_ACCOUNT_PRIVATE_KEY: '0x12' });
    expect(bad.ok).toBe(false);
  });
});

describe('NETWORKS', () => {
  it('matches the genlayer-js chain definitions it stands in for', () => {
    for (const name of Object.keys(NETWORKS) as Array<keyof typeof NETWORKS>) {
      const ours = NETWORKS[name];
      const sdk = sdkChains[name];
      expect(ours.id).toBe(sdk.id);
      expect(ours.name).toBe(sdk.name);
      expect(ours.rpcUrls.default.http[0]).toBe(sdk.rpcUrls.default.http[0]);
      expect(ours.nativeCurrency).toEqual(sdk.nativeCurrency);
    }
  });
});
