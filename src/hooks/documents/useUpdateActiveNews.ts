import { useCallback } from 'react';
import { CreateNewsDto } from '@/types/dto/create-news-dto';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useUpdateActiveNews = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const updateActiveNews = useCallback((newsId: number, data: CreateNewsDto) => {
    return handleRequest(() => documentsService.updateActiveNews(newsId, data));
  }, [handleRequest]);

  return { updateActiveNews, loading, error };
};