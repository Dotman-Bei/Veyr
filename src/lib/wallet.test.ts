import { describe, expect, it, vi } from 'vitest';
import { studionet } from 'genlayer-js/chains';
import { addChainParams, ensureChain, subscribeWallet, type Eip1193Provider } from './wallet';

const STUDIONET_HEX = '0xf22f';

function fakeProvider(initialChain: string, overrides: Record<string, (params: unknown) => unknown> = {}) {
  let chain = initialChain;
  const listeners: Record<string, Array<(...args: unknown[]) => void>> = {};
  const provider: Eip1193Provider & { emit: (event: string, value: unknown) => void } = {
    request: vi.fn(async ({ method, params }) => {
      if (overrides[method]) return overrides[method](params);
      if (method === 'eth_chainId') return chain;
      if (method === 'wallet_switchEthereumChain') {
        chain = (params as Array<{ chainId: string }>)[0].chainId;
        return null;
      }
      return null;
    }),
    on: (event, fn) => void (listeners[event] ??= []).push(fn),
    removeListener: (event, fn) => void (listeners[event] = (listeners[event] ?? []).filter((l) => l !== fn)),
    emit: (event, value) => listeners[event]?.forEach((fn) => fn(value)),
  };
  return { provider, setChain: (c: string) => (chain = c) };
}

describe('ensureChain', () => {
  it('does nothing when already on Studionet', async () => {
    const { provider } = fakeProvider(STUDIONET_HEX);
    await ensureChain(provider, studionet);
    expect(provider.request).toHaveBeenCalledTimes(1);
  });

  it('switches to Studionet when on another chain', async () => {
    const { provider } = fakeProvider('0x1');
    await ensureChain(provider, studionet);
    expect(provider.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: STUDIONET_HEX }],
    });
  });

  it('adds the chain when the wallet does not know it (4902)', async () => {
    const state = { added: false };
    const { provider, setChain } = fakeProvider('0x1', {
      wallet_switchEthereumChain: () => {
        throw Object.assign(new Error('Unrecognized chain ID'), { code: 4902 });
      },
      wallet_addEthereumChain: () => {
        state.added = true;
        setChain(STUDIONET_HEX);
        return null;
      },
    });
    await ensureChain(provider, studionet);
    expect(state.added).toBe(true);
  });

  it('reports a wrong network when the user refuses to switch', async () => {
    const { provider } = fakeProvider('0x1', {
      wallet_switchEthereumChain: () => {
        throw Object.assign(new Error('User rejected the request.'), { code: 4001 });
      },
    });
    await expect(ensureChain(provider, studionet)).rejects.toMatchObject({ kind: 'wrong-network' });
  });
});

describe('addChainParams', () => {
  it('describes Studionet for wallet_addEthereumChain', () => {
    const params = addChainParams(studionet);
    expect(params.chainId).toBe(STUDIONET_HEX);
    expect(params.rpcUrls).toEqual(['https://studio.genlayer.com/api']);
    expect(params.nativeCurrency.symbol).toBe('GEN');
  });
});

describe('subscribeWallet', () => {
  it('forwards account, chain and disconnect events and unsubscribes', () => {
    const { provider } = fakeProvider(STUDIONET_HEX);
    const onAccountChange = vi.fn();
    const onChainChange = vi.fn();
    const onDisconnect = vi.fn();
    const off = subscribeWallet(provider, { onAccountChange, onChainChange, onDisconnect });

    provider.emit('accountsChanged', ['0xabc']);
    provider.emit('accountsChanged', []);
    provider.emit('chainChanged', '0x1');
    provider.emit('disconnect', null);
    expect(onAccountChange.mock.calls).toEqual([['0xabc'], [null]]);
    expect(onChainChange).toHaveBeenCalledWith(1);
    expect(onDisconnect).toHaveBeenCalledOnce();

    off();
    provider.emit('accountsChanged', ['0xdef']);
    expect(onAccountChange).toHaveBeenCalledTimes(2);
  });
});
