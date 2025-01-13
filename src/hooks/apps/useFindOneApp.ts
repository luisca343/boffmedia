import { useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { App } from '@/types';

export const useFindOneApp = (id: number) => {
  const { loading, error, data: app, handleRequest } = useRotomRequest<App>();

  const findOne = useCallback(() => {
    return handleRequest(() => appsService.findOne(id));
  }, [handleRequest, id]);

  useEffect(() => {
    findOne();
  }, [findOne]);

  return { app, findOne, loading, error };
};