import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { AppConfig } from '@/lib/config';
import { VeyrContract } from '@/lib/genlayer';
import { shortAddress } from '@/lib/utils';
import { useBoard, type BoardState } from './useBoard';
import { useReputation } from './useReputation';
import { useWallet, type WalletState } from './useWallet';

interface VeyrContextValue {
  config: AppConfig;
  contract: VeyrContract;
  wallet: WalletState;
  board: BoardState;
  reputation: { value: number | null; loading: boolean; reload: () => Promise<void> };
}

const VeyrContext = createContext<VeyrContextValue | null>(null);

export function VeyrProvider({ config, children }: { config: AppConfig; children: ReactNode }) {
  const contract = useMemo(() => new VeyrContract(config), [config]);

  const onAccountChanged = useCallback((account: string | null) => {
    if (account) toast.info(`Switched to ${shortAddress(account)}`, { description: 'Posts will now be signed by this account.' });
    else toast.info('Wallet disconnected');
  }, []);

  const wallet = useWallet(config, onAccountChanged);
  const board = useBoard(contract);
  const rep = useReputation(contract, wallet.signerAddress, board.updatedAt);

  const value = useMemo(
    () => ({
      config,
      contract,
      wallet,
      board,
      reputation: { value: rep.reputation, loading: rep.loading, reload: rep.reload },
    }),
    [config, contract, wallet, board, rep.reputation, rep.loading, rep.reload],
  );

  return <VeyrContext.Provider value={value}>{children}</VeyrContext.Provider>;
}

export function useVeyr(): VeyrContextValue {
  const value = useContext(VeyrContext);
  if (!value) throw new Error('useVeyr must be used inside <VeyrProvider>');
  return value;
}
