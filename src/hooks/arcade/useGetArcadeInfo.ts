import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { App } from '@/types';
import { arcadeService } from '@/services/api/smartrotom/arcadeService';

export const useGetArcadeInfo = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const info = useCallback(() => {
    return handleRequest<App>(() => arcadeService.getInfo());
  }, [handleRequest]);

  return { info, loading, error };
};

