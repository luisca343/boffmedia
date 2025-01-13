import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';
import { useBoffSession } from '@/services/useBoffSession';

export const useGetEnergy = () => {
  const { session } = useBoffSession();
  const { loading, error, data: energy, handleRequest } = useRotomRequest<number>();

  const getEnergy = useCallback((uuid: string) => {
    return handleRequest(() => minaService.getEnergy(uuid));
  }, [handleRequest]);

  useEffect(() => {
    if (session) {
      getEnergy(session?.user?.smartRotomUser?.uuid!);
    }
  }, [session, getEnergy]);

  return { getEnergy, loading, error, energy };
};