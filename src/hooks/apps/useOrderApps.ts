import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomAppsService } from '@/services/api/rotomAppsService';
import { OrderAppDto } from '@/types/dto/order-apps.dto';


export const useOrderApps = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const order = useCallback((orderAppDto: OrderAppDto) => {
    return handleRequest<{ success: boolean }>(() => rotomAppsService.order(orderAppDto));
  }, [handleRequest]);

  return { order, loading, error };
};

