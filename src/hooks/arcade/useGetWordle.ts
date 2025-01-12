import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { App } from '@/types';
import { rotomArcadeService } from '@/services/api/rotomArcadeService';

export const useGetWordle = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const wordle = useCallback((uuid: string) => {
    return handleRequest<App>(() => rotomArcadeService.getWordle(uuid));
  }, [handleRequest]);

  return { wordle, loading, error };
};

