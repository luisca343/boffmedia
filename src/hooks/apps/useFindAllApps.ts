import { useCallback } from 'react';
import { App } from '@/types';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';

export const useFindAllApps = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const findAll = useCallback(() => {
    return handleRequest<App[]>(appsService.findAll);
  }, [handleRequest]);

  return { findAll, loading, error };
};