import { useCallback, useEffect, useState } from 'react';
import type { AuthorStanding, VeyrContract } from '@/lib/genlayer';

/** On-chain standing (reputation, suspension, cooldown) for one address; re-read whenever `version` changes. */
export function useReputation(contract: VeyrContract, address: `0x${string}` | null, version: unknown) {
  const [standing, setStanding] = useState<AuthorStanding | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!address) {
      setStanding(null);
      return;
    }
    setLoading(true);
    try {
      setStanding(await contract.readAuthor(address));
    } catch {
      setStanding(null);
    } finally {
      setLoading(false);
    }
  }, [contract, address]);

  useEffect(() => {
    load();
  }, [load, version]);

  return { reputation: standing?.reputation ?? null, standing, loading, reload: load };
}
