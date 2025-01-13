import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { minaService } from '@/services/api/smartrotom/minaService';

export const useClaim = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const claim = useCallback((data: { uuid: string }) => {
    return handleRequest(() => minaService.claim(data));
  }, [handleRequest]);

  return { claim, loading, error };
};