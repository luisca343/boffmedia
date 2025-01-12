import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useGetDocument = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getDocument = useCallback((id: number) => {
    return handleRequest(() => documentsService.getDocument(id));
  }, [handleRequest]);

  return { getDocument, loading, error };
};