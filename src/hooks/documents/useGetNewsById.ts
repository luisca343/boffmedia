import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useGetNewsById = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNewsById = useCallback((newsId: number) => {
    return handleRequest(() => rotomDocumentsService.getNewsById(newsId));
  }, [handleRequest]);

  return { getNewsById, loading, error };
};