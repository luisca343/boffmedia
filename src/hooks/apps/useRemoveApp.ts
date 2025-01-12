import { useCallback } from 'react';
import { rotomAppsService } from '@/services/api/rotomAppsService';
import { useRotomRequest } from '../useRotomRequest';

export const useRemoveApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const remove = useCallback((id: number) => {
    return handleRequest<{ success: boolean }>(() => rotomAppsService.remove(id));
  }, [handleRequest]);

  return { remove, loading, error };
};

