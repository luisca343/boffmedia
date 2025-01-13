import { useCallback, useEffect } from 'react';
import { App } from '@/types';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';

export const useFindAllApps = () => {
  const { loading, error, data: apps, handleRequest } = useRotomRequest<App[]>();

  const findAll = useCallback(() => {
    handleRequest(() => appsService.findAll());
  }, [handleRequest]);

  useEffect(() => {
    findAll();
  }, [findAll]);

  return { apps, findAll, loading, error };
};