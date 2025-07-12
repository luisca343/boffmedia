import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { MinaService } from '@/services/api/smartrotom/minaService';

export const usePlay = (uuid: string) => {
  const requestFn = useCallback(() => MinaService.playGame({ uuid }), [uuid]);

  return useRotomRequest(requestFn, [uuid]);
};

