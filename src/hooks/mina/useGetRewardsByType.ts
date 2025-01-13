import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useGetRewardsByType = () => {
  const { loading, error, data: rewardsByType, handleRequest } = useRotomRequest();

  const getRewardsByType = useCallback(() => {
    return handleRequest(() => minaService.getRewardsByType());
  }, [handleRequest]);

  useEffect(() => {
    getRewardsByType();
  }, [getRewardsByType]);

  return { rewardsByType, loading, error };
};