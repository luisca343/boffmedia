import { useCallback } from 'react';
import { CreateDocumentDtoWithUuid } from '@/types/dto/create-document.dto';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useCreateNote = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createNote = useCallback((data: CreateDocumentDtoWithUuid) => {
    return handleRequest(() => documentsService.createNote(data));
  }, [handleRequest]);

  return { createNote, loading, error };
};