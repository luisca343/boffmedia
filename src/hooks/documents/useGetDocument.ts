import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useGetDocument = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getDocument = useCallback((id: number) => {
    return handleRequest(() => rotomDocumentsService.getDocument(id));
  }, [handleRequest]);

  return { getDocument, loading, error };
};