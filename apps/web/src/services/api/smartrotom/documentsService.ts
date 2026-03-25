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
  SuccessResponse,
} from '@/generated/api';

export class DocumentsService {
  // ==================== DOCUMENT OPERATIONS ====================
  
  /**
   * Get a document by ID
   */
  static getDocument(id: number) {
    return rotomGET<Document>(`/documents/document/${id}`);
  }
  
  /**
   * Create a new document
   */
  static createDocument(data: CreateDocumentDto) {
    return rotomPOST<Document>('/documents/document', data);
  }
  
  /**
   * Update an existing document
   */
  static updateDocument(id: number, data: UpdateDocumentDto) {
    return rotomPUT<Document>(`/documents/document/${id}`, data);
  }
  
  /**
   * Delete a document
   */
  static deleteDocument(id: number) {
    return rotomDELETE<SuccessResponse>(`/documents/document/${id}`);
  }

  // ==================== NOTE OPERATIONS ====================
  
  /**
   * Get all notes for a user
   */
  static getUserNotes(uuid: string) {
    return rotomGET<NotePreview[]>(`/documents/all/${uuid}`);
  }
  
  /**
   * Create a new note
   */
  static createNote(data: CreateDocumentDtoWithUuid) {
    return rotomPOST<CreateNoteResponse>('/documents/create', data);
  }
  
  /**
   * Save a note
   */
  static saveNote(id: number, data: CreateDocumentDto) {
    return rotomPOST<SaveDocumentResponse>(`/documents/save/${id}`, data);
  }
  
  /**
   * Add a note to a user
   */
  static addNoteToUser(noteId: number, uuid: string) {
    return rotomPOST<SuccessResponse>(`/documents/note/${noteId}/user/${uuid}`, {});
  }
  
  /**
   * Remove a note from a user
   */
  static removeNoteFromUser(noteId: number, uuid: string) {
    return rotomDELETE<SuccessResponse>(`/documents/note/${noteId}/user/${uuid}`);
  }

  // ==================== NEWS OPERATIONS ====================
  
  /**
   * Get all news articles
   */
  static getAllNews() {
    return rotomGET<NewsResponse>('/documents/news');
  }
  
  /**
   * Get published news articles only
   */
  static getPublishedNews() {
    return rotomGET<NewsResponse>('/documents/news?published=true');
  }
  
  /**
   * Get the featured news article
   */
  static getFeaturedNews() {
    return rotomGET<News | null>('/documents/news/featured');
  }
  
  /**
   * Get a specific news article by ID
   */
  static getNewsById(newsId: number) {
    return rotomGET<News>(`/documents/news/${newsId}`);
  }
  
  /**
   * Create a new news article
   */
  static createNews(data: CreateNewsDto) {
    return rotomPOST<News>('/documents/news', data);
  }
  
  /**
   * Update an existing news article
   */
  static updateNews(newsId: number, data: UpdateNewsDto) {
    return rotomPUT<News>(`/documents/news/${newsId}`, data);
  }
  
  /**
   * Delete a news article
   */
  static deleteNews(newsId: number) {
    return rotomDELETE<SuccessResponse>(`/documents/news/${newsId}`);
  }
  
  /**
   * Update news article status
   */
  static updateNewsStatus(data: NewsStatusDto) {
    return rotomPOST<SuccessResponse>('/documents/newsstatus', data);
  }

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Legacy method: Get notes for a user
   */
  static getNotes(uuid: string) {
    return rotomGET<NotePreview[]>(`/documents/all/${uuid}`);
  }

  /**
   * Legacy method: Update active news
   */
  static updateActiveNews(newsId: number, data: UpdateNewsDto) {
    return rotomPUT<News>(`/documents/news/${newsId}`, data);
  }
}