import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { UpdateAppDto } from '@/types/dto/update-app.dto';
import { App } from '@/types';

export const useUpdateApp = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const update = useCallback((id: number, updateAppDto: UpdateAppDto) => {
    return handleRequest<App>(() => appsService.update(id, updateAppDto));
  }, [handleRequest]);

  return { update, loading, error };
};

