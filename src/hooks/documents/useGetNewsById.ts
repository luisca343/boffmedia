import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useGetNewsById = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNewsById = useCallback((newsId: number) => {
    return handleRequest(() => documentsService.getNewsById(newsId));
  }, [handleRequest]);

  return { getNewsById, loading, error };
};