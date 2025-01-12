import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { App } from '@/types';

export const useFindOneApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const findOne = useCallback((id: number) => {
    return handleRequest<App>(() => appsService.findOne(id));
  }, [handleRequest]);

  return { findOne, loading, error };
};

