import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { OrderAppDto } from '@/types/dto/order-apps.dto';


export const useOrderApps = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const order = useCallback((orderAppDto: OrderAppDto) => {
    return handleRequest<{ success: boolean }>(() => appsService.order(orderAppDto));
  }, [handleRequest]);

  return { order, loading, error };
};

