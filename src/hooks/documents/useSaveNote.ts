import { useCallback } from 'react';
import { CreateDocumentDto } from '@/types/dto/create-document.dto';
import { useRotomRequest } from '../useRotomRequest';
import { rotomDocumentsService } from '@/services/api/rotomDocumentsService';

export const useSaveNote = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const saveNote = useCallback((id: number, data: CreateDocumentDto) => {
    return handleRequest(() => rotomDocumentsService.saveNote(id, data));
  }, [handleRequest]);

  return { saveNote, loading, error };
};