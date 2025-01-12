import { useCallback } from 'react';
import { NewsStatusDto } from '@/types/dto/news-status-dto';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useUpdateNewsStatus = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const updateNewsStatus = useCallback((data: NewsStatusDto) => {
    return handleRequest(() => documentsService.updateNewsStatus(data));
  }, [handleRequest]);

  return { updateNewsStatus, loading, error };
};