import { useCallback } from 'react';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useGetAllNews = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const getNews = useCallback(() => {
    return handleRequest(() => rotomDocumentsService.getAllNews());
  }, [handleRequest]);

  return { getNews, loading, error };
};