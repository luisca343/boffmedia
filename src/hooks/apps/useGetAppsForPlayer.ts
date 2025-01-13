import { useState, useCallback, useEffect } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { appsService } from '@/services/api/smartrotom/appsService';
import { App } from '@/types';

export const useGetAppsForPlayer = (uuid: string | undefined) => {
  const { loading, error, handleRequest } = useRotomRequest();
  const [apps, setApps] = useState<App[]>([]);

  const getForPlayer = useCallback((uuid: string) => {
    return handleRequest(() => appsService.getForPlayer(uuid)) as Promise<App[]>;
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

