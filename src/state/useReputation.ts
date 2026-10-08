import { useCallback, useEffect, useState } from 'react';
import type { VeyrContract } from '@/lib/genlayer';

/** On-chain reputation for one address; re-read whenever `version` changes. */
export function useReputation(contract: VeyrContract, address: `0x${string}` | null, version: unknown) {
  const [reputation, setReputation] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!address) {
      setReputation(null);
      return;
    }
    setLoading(true);
    try {
      setReputation(await contract.readReputation(address));
    } catch {
      setReputation(null);
    } finally {
      setLoading(false);
    }
  }, [contract, address]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { reputation, loading, reload: load };
}
