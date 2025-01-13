import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useEndGame = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const endGame = useCallback((data: { uuid: string, rewards: { value: number, id: number }[] }) => {
    return handleRequest(() => minaService.endGame(data));
  }, [handleRequest]);

  return { endGame, loading, error };
};