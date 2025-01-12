import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { ligaService } from '@/services/api/smartrotom/ligaService';

export const useGetReplay = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getReplay = useCallback((id: number) => {
    return handleRequest(() => ligaService.getReplay(id));
  }, [handleRequest]);

  return { getReplay, loading, error };
};