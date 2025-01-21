import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { SuccessResponse, SuccessResponseWithId } from '@/types';
import { Note, NoteBase, RotomNews } from '@/types/documents';
import { CreateDocumentDto, CreateDocumentDtoWithUuid } from '@/types/dto/create-document.dto';
import { CreateNewsDto } from '@/types/dto/create-news-dto';
import { NewsStatusDto } from '@/types/dto/news-status-dto';

export const documentsService = {
  getNotes: (uuid: string) => rotomGET<NoteBase[]>(`/documents/all/${uuid}`),
  getDocument: (id: number) => rotomGET<Note>(`/documents/${id}`),
  createNote: (data: CreateDocumentDtoWithUuid) => rotomPOST<SuccessResponse>('/documents/create', data),
  getAllNews: () => rotomGET<{ featured: RotomNews; news: RotomNews[] }>('/documents/news'),
  getNewsById: (newsId: number) => rotomGET<RotomNews>(`/documents/news/${newsId}`),
  updateActiveNews: (newsId: number, data: CreateNewsDto) => rotomPOST<SuccessResponseWithId>(`/documents/news/${newsId}`, data),
  updateNewsStatus: (data: NewsStatusDto) => rotomPOST<SuccessResponse>('/documents/newsstatus', data),
  saveNote: (id: number, data: CreateDocumentDto) => rotomPOST<SuccessResponseWithId>(`/documents/save/${id}`, data),
};

