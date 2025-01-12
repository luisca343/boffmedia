import { useCallback } from 'react';
import { App } from '@/types';
import { useRotomRequest } from '../useRotomRequest';
import { rotomAppsService } from '@/services/api/rotomAppsService';

export const useFindAllApps = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const findAll = useCallback(() => {
    return handleRequest<App[]>(rotomAppsService.findAll);
  }, [handleRequest]);

  return { findAll, loading, error };
};