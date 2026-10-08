// Runtime configuration for the Veyr frontend, read from Vite env vars.
//
// Every value is validated up front so a misconfigured build shows a clear
// message instead of failing later with an opaque RPC error.

import { localnet, studionet } from 'genlayer-js/chains';

export const NETWORKS = { studionet, localnet } as const;
export type NetworkName = keyof typeof NETWORKS;
export type GenLayerChain = (typeof NETWORKS)[NetworkName];

export interface AppConfig {
  network: NetworkName;
  chain: GenLayerChain;
  contractAddress: `0x${string}`;
  rpcUrl: string;
  rpcOverridden: boolean;
  devPrivateKey: `0x${string}` | null;
}

export type ConfigResult = { ok: true; config: AppConfig } | { ok: false; errors: string[] };

export interface RawEnv {
  VITE_GENLAYER_NETWORK?: string;
  VITE_GENLAYER_CONTRACT_ADDRESS?: string;
  VITE_GENLAYER_RPC_URL?: string;
  VITE_GENLAYER_ACCOUNT_PRIVATE_KEY?: string;
}

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const PRIVATE_KEY = /^0x[0-9a-fA-F]{64}$/;

/**
 * Clone a chain definition with a different RPC URL. genlayer-js mutates the
 * chain object it is given when `endpoint` is set, so we never pass the shared
 * export directly.
 */
function withRpc(chain: GenLayerChain, rpcUrl: string): GenLayerChain {
  return { ...chain, rpcUrls: { ...chain.rpcUrls, default: { http: [rpcUrl] } } };
}

export function parseConfig(env: RawEnv): ConfigResult {
  const errors: string[] = [];

  const networkName = (env.VITE_GENLAYER_NETWORK || 'studionet').trim();
  const isKnownNetwork = Object.hasOwn(NETWORKS, networkName);
  if (!isKnownNetwork) {
    errors.push(
      `Unsupported VITE_GENLAYER_NETWORK "${networkName}". Expected one of: ${Object.keys(NETWORKS).join(', ')}.`,
    );
  }

  const contractAddress = (env.VITE_GENLAYER_CONTRACT_ADDRESS ?? '').trim();
  if (!contractAddress) {
    errors.push('Missing VITE_GENLAYER_CONTRACT_ADDRESS. Deploy the contract (npm run deploy) and set it in .env.');
  } else if (!ADDRESS.test(contractAddress)) {
    errors.push(`VITE_GENLAYER_CONTRACT_ADDRESS "${contractAddress}" is not a valid 0x-prefixed 20-byte address.`);
  }

  const rpcOverride = (env.VITE_GENLAYER_RPC_URL ?? '').trim();
  if (rpcOverride) {
    let url: URL | null = null;
    try {
      url = new URL(rpcOverride);
    } catch {
      /* handled below */
    }
    if (!url || (url.protocol !== 'https:' && url.protocol !== 'http:')) {
      errors.push(`VITE_GENLAYER_RPC_URL "${rpcOverride}" must be an http(s) URL.`);
    }
  }

  const rawKey = (env.VITE_GENLAYER_ACCOUNT_PRIVATE_KEY ?? '').trim();
  const devKey = rawKey ? (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) : '';
  if (devKey && !PRIVATE_KEY.test(devKey)) {
    errors.push('VITE_GENLAYER_ACCOUNT_PRIVATE_KEY must be a 32-byte hex string (or left empty).');
  }

  if (errors.length > 0 || !isKnownNetwork) return { ok: false, errors };

  const network = networkName as NetworkName;
  const baseChain = NETWORKS[network];
  const chain = rpcOverride ? withRpc(baseChain, rpcOverride) : withRpc(baseChain, baseChain.rpcUrls.default.http[0]);

  return {
    ok: true,
    config: {
      network,
      chain,
      contractAddress: contractAddress as `0x${string}`,
      rpcUrl: chain.rpcUrls.default.http[0],
      rpcOverridden: Boolean(rpcOverride),
      devPrivateKey: devKey ? (devKey as `0x${string}`) : null,
    },
  };
}

export const configResult: ConfigResult = parseConfig(import.meta.env as RawEnv);
