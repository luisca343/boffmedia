import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomAppsService } from '@/services/api/rotomAppsService';
import { CreateAppDto } from '@/types/dto/create-app.dto';
import { App } from '@/types';

export const useCreateApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const create = useCallback((createAppDto: CreateAppDto) => {
    return handleRequest<App>(() => rotomAppsService.create(createAppDto));
  }, [handleRequest]);

  return { create, loading, error };
};

