// EIP-1193 browser wallet integration (MetaMask and compatible wallets).
//
// genlayer-js skips its own chain check on Studio networks, so this module is
// responsible for making sure the wallet is on the configured GenLayer chain
// before any write is signed.

import type { GenLayerChain } from './config';
import { VeyrError, toVeyrError } from './errors';

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

export function getProvider(): Eip1193Provider | null {
  return typeof window !== 'undefined' && window.ethereum ? window.ethereum : null;
}

export function requireProvider(): Eip1193Provider {
  const provider = getProvider();
  if (!provider) {
    throw new VeyrError('no-wallet', 'No browser wallet found. Install MetaMask (or another EIP-1193 wallet) to post.');
  }
  return provider;
}

export const toHexChainId = (id: number) => `0x${id.toString(16)}`;

function firstAccount(accounts: unknown): `0x${string}` | null {
  if (!Array.isArray(accounts) || typeof accounts[0] !== 'string') return null;
  return accounts[0] as `0x${string}`;
}

/** Accounts already authorized for this site (no prompt). */
export async function getAuthorizedAccount(provider: Eip1193Provider): Promise<`0x${string}` | null> {
  try {
    return firstAccount(await provider.request({ method: 'eth_accounts' }));
  } catch {
    return null;
  }
}

export async function getChainId(provider: Eip1193Provider): Promise<number | null> {
  try {
    const hex = await provider.request({ method: 'eth_chainId' });
    return typeof hex === 'string' ? parseInt(hex, 16) : null;
  } catch {
    return null;
  }
}

export function addChainParams(chain: GenLayerChain) {
  const explorer = chain.blockExplorers?.default?.url;
  return {
    chainId: toHexChainId(chain.id),
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [...chain.rpcUrls.default.http],
    ...(explorer ? { blockExplorerUrls: [explorer] } : {}),
  };
}

/** Switch the wallet to the configured chain, adding it first if unknown. */
export async function ensureChain(provider: Eip1193Provider, chain: GenLayerChain): Promise<void> {
  if ((await getChainId(provider)) === chain.id) return;
  const chainId = toHexChainId(chain.id);
  try {
    await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
  } catch (err) {
    const code = (err as { code?: number })?.code;
    const unknownChain = code === 4902 || /unrecognized chain|unknown chain|not been added/i.test(String((err as Error)?.message));
    if (!unknownChain) {
      const veyr = toVeyrError(err);
      if (veyr.kind === 'user-rejected') {
        throw new VeyrError('wrong-network', `Switch your wallet to ${chain.name} to post.`, { cause: err });
      }
      throw veyr;
    }
    try {
      await provider.request({ method: 'wallet_addEthereumChain', params: [addChainParams(chain)] });
    } catch (addErr) {
      throw new VeyrError('wrong-network', `Add ${chain.name} to your wallet to post.`, { cause: addErr });
    }
  }
  if ((await getChainId(provider)) !== chain.id) {
    throw new VeyrError('wrong-network', `Your wallet is not on ${chain.name}. Switch networks and try again.`);
  }
}

/** Prompt for account access and make sure the wallet is on the right chain. */
export async function connectWallet(chain: GenLayerChain): Promise<`0x${string}`> {
  const provider = requireProvider();
  let account: `0x${string}` | null;
  try {
    account = firstAccount(await provider.request({ method: 'eth_requestAccounts' }));
  } catch (err) {
    throw toVeyrError(err);
  }
  if (!account) throw new VeyrError('user-rejected', 'No account was authorized in your wallet.');
  await ensureChain(provider, chain);
  return account;
}

export interface WalletEvents {
  onAccountChange: (account: `0x${string}` | null) => void;
  onChainChange: (chainId: number | null) => void;
  onDisconnect: () => void;
}

/** Subscribe to wallet events; returns an unsubscribe function. */
export function subscribeWallet(provider: Eip1193Provider, events: WalletEvents): () => void {
  const accounts = (value: unknown) => events.onAccountChange(firstAccount(value));
  const chain = (value: unknown) => events.onChainChange(typeof value === 'string' ? parseInt(value, 16) : null);
  const disconnect = () => events.onDisconnect();
  provider.on?.('accountsChanged', accounts);
  provider.on?.('chainChanged', chain);
  provider.on?.('disconnect', disconnect);
  return () => {
    provider.removeListener?.('accountsChanged', accounts);
    provider.removeListener?.('chainChanged', chain);
    provider.removeListener?.('disconnect', disconnect);
  };
}
