import { useState, useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomAppsService } from '@/services/api/rotomAppsService';
import { App } from '@/types';

export const useGetAppsForPlayer = (uuid: string | undefined) => {
  const { loading, error, handleRequest } = useRotomRequest();
  const [apps, setApps] = useState<App[]>([]);

  const getForPlayer = useCallback((uuid: string) => {
    return handleRequest<App[]>(() => rotomAppsService.getForPlayer(uuid));
  }, [handleRequest]);

  useEffect(() => {
    if (uuid) {
      getForPlayer(uuid).then((result) => {
        if (result) {
          setApps(result);
        }
      });
    }
  }, [uuid, getForPlayer]);

  return { apps, setApps, loading, error };
};

