import { useCallback } from 'react';
import { CreateDocumentDtoWithUuid } from '@/types/dto/create-document.dto';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useCreateNote = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const createNote = useCallback((data: CreateDocumentDtoWithUuid) => {
    return handleRequest(() => rotomDocumentsService.createNote(data));
  }, [handleRequest]);

  return { createNote, loading, error };
};