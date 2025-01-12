import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useGetNotes = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNotes = useCallback((uuid: string) => {
    return handleRequest(() => rotomDocumentsService.getNotes(uuid));
  }, [handleRequest]);

  return { getNotes, loading, error };
};