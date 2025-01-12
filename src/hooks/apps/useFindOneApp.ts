import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomAppsService } from '@/services/api/rotomAppsService';
import { App } from '@/types';

export const useFindOneApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const findOne = useCallback((id: number) => {
    return handleRequest<App>(() => rotomAppsService.findOne(id));
  }, [handleRequest]);

  return { findOne, loading, error };
};

