import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useGetRanking = () => {
  const { loading, error, data: ranking, handleRequest } = useRotomRequest();

  const getRanking = useCallback(() => {
    return handleRequest(() => minaService.getRanking());
  }, [handleRequest]);

  useEffect(() => {
    getRanking();
  }, [getRanking]);

  return { ranking, loading, error };
};