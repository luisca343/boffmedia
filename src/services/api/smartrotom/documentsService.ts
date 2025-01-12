import { rotomGET, rotomPOST } from '@/services/boffAPI';
import { CreateDocumentDto, CreateDocumentDtoWithUuid } from '@/types/dto/create-document.dto';
import { CreateNewsDto } from '@/types/dto/create-news-dto';
import { NewsStatusDto } from '@/types/dto/news-status-dto';

export const documentsService = {
  getNotes: (uuid: string) => rotomGET(`/documents/all/${uuid}`),
  createNote: (data: CreateDocumentDtoWithUuid) => rotomPOST('/documents/create', data),
  getAllNews: () => rotomGET('/documents/news'),
  getNewsById: (newsId: number) => rotomGET(`/documents/news/${newsId}`),
  updateActiveNews: (newsId: number, data: CreateNewsDto) => rotomPOST(`/documents/news/${newsId}`, data),
  updateNewsStatus: (data: NewsStatusDto) => rotomPOST('/documents/newsstatus', data),
  saveNote: (id: number, data: CreateDocumentDto) => rotomPOST(`/documents/save/${id}`, data),
  getDocument: (id: number) => rotomGET(`/documents/${id}`)
};