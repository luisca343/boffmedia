import { rotomGET, rotomPOST, rotomPUT, rotomDELETE } from '@/services/boffAPI';
import type {
  CreateDocumentDto,
  CreateDocumentDtoWithUuid,
  UpdateDocumentDto,
  CreateNewsDto,
  UpdateNewsDto,
  NewsStatusDto,
  Document,
  NotePreview,
  CreateNoteResponse,
  SaveDocumentResponse,
  News,
  NewsResponse,
} from '@/generated/api';
import { SuccessResponse } from '@/types';

export const documentsService = {
  // ==================== DOCUMENT OPERATIONS ====================
  
  /**
   * Get a document by ID
   */
  getDocument: (id: number) => rotomGET<Document>(`/documents/${id}`),
  
  /**
   * Create a new document
   */
  createDocument: (data: CreateDocumentDto) => rotomPOST<Document>('/documents/document', data),
  
  /**
   * Update an existing document
   */
  updateDocument: (id: number, data: UpdateDocumentDto) => 
    rotomPUT<Document>(`/documents/document/${id}`, data),
  
  /**
   * Delete a document
   */
  deleteDocument: (id: number) => rotomDELETE<SuccessResponse>(`/documents/document/${id}`),

  // ==================== NOTE OPERATIONS ====================
  
  /**
   * Get all notes for a user
   */
  getUserNotes: (uuid: string) => rotomGET<NotePreview[]>(`/documents/all/${uuid}`),
  
  /**
   * Create a new note
   */
  createNote: (data: CreateDocumentDtoWithUuid) => 
    rotomPOST<CreateNoteResponse>('/documents/create', data),
  
  /**
   * Save a note
   */
  saveNote: (id: number, data: CreateDocumentDto) => 
    rotomPOST<SaveDocumentResponse>(`/documents/save/${id}`, data),
  
  /**
   * Add a note to a user
   */
  addNoteToUser: (noteId: number, uuid: string) => 
    rotomPOST<SuccessResponse>(`/documents/note/${noteId}/user/${uuid}`, {}),
  
  /**
   * Remove a note from a user
   */
  removeNoteFromUser: (noteId: number, uuid: string) => 
    rotomDELETE<SuccessResponse>(`/documents/note/${noteId}/user/${uuid}`),

  // ==================== NEWS OPERATIONS ====================
  
  /**
   * Get all news articles
   */
  getAllNews: () => rotomGET<NewsResponse>('/documents/news'),
  
  /**
   * Get published news articles only
   */
  getPublishedNews: () => rotomGET<NewsResponse>('/documents/news?published=true'),
  
  /**
   * Get the featured news article
   */
  getFeaturedNews: () => rotomGET<News | null>('/documents/news/featured'),
  
  /**
   * Get a specific news article by ID
   */
  getNewsById: (newsId: number) => rotomGET<News>(`/documents/news/${newsId}`),
  
  /**
   * Create a new news article
   */
  createNews: (data: CreateNewsDto) => rotomPOST<News>('/documents/news', data),
  
  /**
   * Update an existing news article
   */
  updateNews: (newsId: number, data: UpdateNewsDto) => 
    rotomPUT<News>(`/documents/news/${newsId}`, data),
  
  /**
   * Delete a news article
   */
  deleteNews: (newsId: number) => rotomDELETE<SuccessResponse>(`/documents/news/${newsId}`),
  
  /**
   * Update news article status
   */
  updateNewsStatus: (data: NewsStatusDto) => 
    rotomPOST<SuccessResponse>('/documents/newsstatus', data),

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Legacy method: Get notes for a user
   */
  getNotes: (uuid: string) => rotomGET<NotePreview[]>(`/documents/all/${uuid}`),

  /**
   * Legacy method: Update active news
   */
  updateActiveNews: (newsId: number, data: UpdateNewsDto) => 
    rotomPUT<News>(`/documents/news/${newsId}`, data),
};