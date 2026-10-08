import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppConfig } from '@/lib/config';
import { VeyrError, toVeyrError } from '@/lib/errors';
import { loadSdk, type Signer } from '@/lib/genlayer';
import {
  connectWallet,
  ensureChain,
  getAuthorizedAccount,
  getChainId,
  getProvider,
  requireProvider,
  subscribeWallet,
} from '@/lib/wallet';

// Remembers an explicit "disconnect" so a reload does not silently reconnect.
const DISCONNECTED_KEY = 'veyr-wallet-disconnected';

function rememberDisconnected(value: boolean) {
  try {
    if (value) localStorage.setItem(DISCONNECTED_KEY, '1');
    else localStorage.removeItem(DISCONNECTED_KEY);
  } catch {
    /* storage unavailable */
  }
}

function wasDisconnected() {
  try {
    return localStorage.getItem(DISCONNECTED_KEY) === '1';
  } catch {
    return false;
  }
}

export interface WalletState {
  hasWallet: boolean;
  account: `0x${string}` | null;
  chainId: number | null;
  wrongNetwork: boolean;
  connecting: boolean;
  error: VeyrError | null;
  /** Who will sign submit_post: the connected wallet, else the optional dev key. */
  signer: Signer | null;
  signerAddress: `0x${string}` | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  /** Make sure a wallet signer is on the configured chain right before a write. */
  prepareToSign: () => Promise<void>;
  clearError: () => void;
}

export function useWallet(config: AppConfig, onAccountChanged?: (account: string | null) => void): WalletState {
  const [provider] = useState(getProvider);
  const [account, setAccount] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<VeyrError | null>(null);

  // Restore an already-authorized account on reload and follow wallet events.
  useEffect(() => {
    if (!provider) return;
    let active = true;
    (async () => {
      const id = await getChainId(provider);
      if (active) setChainId(id);
      if (wasDisconnected()) return;
      const restored = await getAuthorizedAccount(provider);
      if (active && restored) setAccount(restored);
    })();
    const unsubscribe = subscribeWallet(provider, {
      onAccountChange: (next) => {
        setAccount(next);
        if (next) rememberDisconnected(false);
        onAccountChanged?.(next);
      },
      onChainChange: setChainId,
      onDisconnect: () => setAccount(null),
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [provider, onAccountChanged]);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const connected = await connectWallet(config.chain);
      rememberDisconnected(false);
      setAccount(connected);
      setChainId(config.chain.id);
    } catch (err) {
      const veyr = toVeyrError(err);
      setError(veyr);
      // The account may be authorized even if the network switch was refused.
      if (provider) {
        const restored = await getAuthorizedAccount(provider);
        if (restored) setAccount(restored);
        setChainId(await getChainId(provider));
      }
      throw veyr;
    } finally {
      setConnecting(false);
    }
  }, [config.chain, provider]);

  const disconnect = useCallback(() => {
    rememberDisconnected(true);
    setAccount(null);
    setError(null);
    // Best effort: wallets that support it drop the site permission too.
    provider?.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] }).catch(() => {});
  }, [provider]);

  const switchNetwork = useCallback(async () => {
    setError(null);
    try {
      await ensureChain(requireProvider(), config.chain);
      setChainId(config.chain.id);
    } catch (err) {
      const veyr = toVeyrError(err);
      setError(veyr);
      throw veyr;
    }
  }, [config.chain]);

  const prepareToSign = useCallback(async () => {
    if (!account || !provider) return;
    await ensureChain(provider, config.chain);
    setChainId(config.chain.id);
  }, [account, provider, config.chain]);

  // Dev-key fallback address (development only); derived once the SDK has loaded.
  const [devAddress, setDevAddress] = useState<`0x${string}` | null>(null);
  useEffect(() => {
    const key = config.devPrivateKey;
    if (!key) return setDevAddress(null);
    let active = true;
    loadSdk().then(({ sdk }) => active && setDevAddress(sdk.createAccount(key).address));
    return () => {
      active = false;
    };
  }, [config.devPrivateKey]);

  const signer: Signer | null = useMemo(() => {
    if (account && provider) return { kind: 'wallet', address: account, provider };
    if (config.devPrivateKey) return { kind: 'dev-key', privateKey: config.devPrivateKey };
    return null;
  }, [account, provider, config.devPrivateKey]);

  return {
    hasWallet: Boolean(provider),
    account,
    chainId,
    wrongNetwork: Boolean(account && chainId !== null && chainId !== config.chain.id),
    connecting,
    error,
    signer,
    signerAddress: account ?? devAddress,
    connect,
    disconnect,
    switchNetwork,
    prepareToSign,
    clearError: () => setError(null),
  };
}
