import { useCallback } from 'react';
import { NewsStatusDto } from '@/types/dto/news-status-dto';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useUpdateNewsStatus = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const updateNewsStatus = useCallback((data: NewsStatusDto) => {
    return handleRequest(() => rotomDocumentsService.updateNewsStatus(data));
  }, [handleRequest]);

  return { updateNewsStatus, loading, error };
};