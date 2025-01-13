import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';
import { useBoffSession } from '@/services/useBoffSession';

export interface UnclaimedRewards {
  name: string;
  type: string;
  amount: number;
  itemId: string;
}

export const useGetUnclaimed = () => {
  const { session } = useBoffSession();
  const { loading, error, data: unclaimed, setData: setUnclaimed, handleRequest } = useRotomRequest<UnclaimedRewards[]>();

  const getUnclaimed = useCallback((uuid: string) => {
    return handleRequest(() => minaService.getUnclaimed(uuid));
  }, [handleRequest]);

  useEffect(() => {
    if (session) {
      getUnclaimed(session?.user?.smartRotomUser?.uuid!);
    }
  }, [session, getUnclaimed]);

  function getBoxes() {
    return Math.ceil((unclaimed?.length || 0) / 27);
  }

  return { session, getUnclaimed, setUnclaimed, loading, error, unclaimed, getBoxes };
};