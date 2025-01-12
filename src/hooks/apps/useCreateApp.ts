import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { CreateAppDto } from '@/types/dto/create-app.dto';
import { App } from '@/types';

export const useCreateApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const create = useCallback((createAppDto: CreateAppDto) => {
    return handleRequest<App>(() => appsService.create(createAppDto));
  }, [handleRequest]);

  return { create, loading, error };
};

