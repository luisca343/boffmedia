import { useCallback } from 'react';
import { appsService } from '@/services/api/smartrotom/appsService';
import { useRotomRequest } from '../useRotomRequest';

export const useRemoveApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const remove = useCallback((id: number) => {
    return handleRequest<{ success: boolean }>(() => appsService.remove(id));
  }, [handleRequest]);

  return { remove, loading, error };
};

