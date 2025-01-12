import { useCallback } from 'react';
import { CreateDocumentDto } from '@/types/dto/create-document.dto';
import { useRotomRequest } from '../useRotomRequest';
import { documentsService } from '@/services/api/smartrotom/documentsService';

export const useSaveNote = () => {
  const { loading, error, handleRequest } = useRotomRequest();

  const saveNote = useCallback((id: number, data: CreateDocumentDto) => {
    return handleRequest(() => documentsService.saveNote(id, data));
  }, [handleRequest]);

  return { saveNote, loading, error };
};