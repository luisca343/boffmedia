import { useCallback } from 'react';
import { minaService } from '@/services/api/smartrotom/minaService';
import { useRotomRequest } from '../useRotomRequest';

export const usePlay = (uuid: string) => {
  const requestFn = useCallback(() => minaService.play({ uuid }), [uuid]);

  return useRotomRequest(requestFn, [uuid]);
};

