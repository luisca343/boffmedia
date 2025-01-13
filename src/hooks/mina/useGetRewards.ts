import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useGetRewards = () => {
  const { loading, error, data: rewards, handleRequest } = useRotomRequest();

  const getRewards = useCallback(() => {
    return handleRequest(() => minaService.getRewards());
  }, [handleRequest]);

  useEffect(() => {
    getRewards();
  }, [getRewards]);

  return { rewards, loading, error };
};