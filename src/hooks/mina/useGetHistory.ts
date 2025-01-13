import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useGetHistory = (uuid: string) => {
  const { loading, error, data: history, handleRequest } = useRotomRequest();

  const mineHistory = useCallback(() => {
    return handleRequest(() => minaService.getHistory(uuid));
  }, [handleRequest, uuid]);

  useEffect(() => {
    mineHistory();
  }, [mineHistory]);

  return { history, loading, error };
};