import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useGetNotes = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNotes = useCallback((uuid: string) => {
    return handleRequest(() => documentsService.getNotes(uuid));
  }, [handleRequest]);

  return { getNotes, loading, error };
};