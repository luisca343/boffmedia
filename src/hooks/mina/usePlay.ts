import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const usePlay = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const play = useCallback((data: { uuid: string }) => {
    return handleRequest(() => minaService.play(data));
  }, [handleRequest]);

  return { play, loading, error };
};