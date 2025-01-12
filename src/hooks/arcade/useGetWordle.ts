import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { App } from '@/types';
import { arcadeService } from '@/services/api/smartrotom/arcadeService';

export const useGetWordle = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const wordle = useCallback((uuid: string) => {
    return handleRequest<App>(() => arcadeService.getWordle(uuid));
  }, [handleRequest]);

  return { wordle, loading, error };
};

