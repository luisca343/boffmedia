import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useGetAllNews = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNews = useCallback(() => {
    return handleRequest(() => documentsService.getAllNews());
  }, [handleRequest]);

  return { getNews, loading, error };
};