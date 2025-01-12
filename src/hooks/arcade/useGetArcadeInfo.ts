import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { App } from '@/types';
import { rotomArcadeService } from '@/services/api/rotomArcadeService';

export const useGetArcadeInfo = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const info = useCallback(() => {
    return handleRequest<App>(() => rotomArcadeService.getInfo());
  }, [handleRequest]);

  return { info, loading, error };
};

