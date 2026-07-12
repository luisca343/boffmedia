import { rotomGET, rotomPOST, rotomPUT, rotomDELETE, apiAuthedPOST, apiAuthedPUT, apiAuthedDELETE } from '@/services/boffAPI';
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
  NoteFolder,
  NoteTag,
  NoteVersion,
  CreateFolderDto,
  UpdateFolderDto,
  CreateTagDto,
  UpdateTagDto,
  CreateVersionDto,
} from '@boffmedia/shared';

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

  /** List the UUIDs a note is shared with */
  static getDocumentShares(id: number) {
    return rotomGET<string[]>(`/documents/document/${id}/shares`);
  }

  // ==================== TRASH OPERATIONS ====================

  /** Soft-deleted notes for a user */
  static getTrash(uuid: string) {
    return rotomGET<NotePreview[]>(`/documents/trash/${uuid}`);
  }

  /** Restore a soft-deleted note */
  static restoreDocument(id: number) {
    return rotomPOST<Document>(`/documents/document/${id}/restore`, {});
  }

  /** Permanently delete a note */
  static purgeDocument(id: number) {
    return rotomDELETE<SuccessResponse>(`/documents/document/${id}/purge`);
  }

  // ==================== FOLDER OPERATIONS ====================

  static getFolders(uuid: string) {
    return rotomGET<NoteFolder[]>(`/documents/folders/${uuid}`);
  }

  static createFolder(data: CreateFolderDto) {
    return rotomPOST<NoteFolder>('/documents/folders', data);
  }

  static updateFolder(id: number, data: UpdateFolderDto) {
    return rotomPUT<NoteFolder>(`/documents/folders/${id}`, data);
  }

  static deleteFolder(id: number) {
    return rotomDELETE<SuccessResponse>(`/documents/folders/${id}`);
  }

  // ==================== TAG OPERATIONS ====================

  static getTags(uuid: string) {
    return rotomGET<NoteTag[]>(`/documents/tags/${uuid}`);
  }

  static createTag(data: CreateTagDto) {
    return rotomPOST<NoteTag>('/documents/tags', data);
  }

  static updateTag(id: number, data: UpdateTagDto) {
    return rotomPUT<SuccessResponse>(`/documents/tags/${id}`, data);
  }

  static deleteTag(id: number) {
    return rotomDELETE<SuccessResponse>(`/documents/tags/${id}`);
  }

  /** Toggle a tag on a note (adds if absent, removes if present) */
  static toggleNoteTag(documentId: number, tagId: number) {
    return rotomPOST<{ success: boolean; applied: boolean }>(
      `/documents/document/${documentId}/tag/${tagId}`,
      {},
    );
  }

  // ==================== VERSION OPERATIONS ====================

  static getVersions(documentId: number) {
    return rotomGET<NoteVersion[]>(`/documents/document/${documentId}/versions`);
  }

  /** Snapshot the current note content as a version */
  static snapshotVersion(documentId: number, data: CreateVersionDto) {
    return rotomPOST<NoteVersion>(
      `/documents/document/${documentId}/versions`,
      data,
    );
  }

  /** Restore a note to a previous version */
  static restoreVersion(versionId: number) {
    return rotomPOST<Document>(`/documents/versions/${versionId}/restore`, {});
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
   * Create a new news article (requires auth token)
   */
  static createNews(data: CreateNewsDto, token: string) {
    return apiAuthedPOST<News>('/smartrotom/documents/news', data, token);
  }
  
  /**
   * Update an existing news article (requires auth token)
   */
  static updateNews(newsId: number, data: UpdateNewsDto, token: string) {
    return apiAuthedPUT<News>(`/smartrotom/documents/news/${newsId}`, data, token);
  }
  
  /**
   * Delete a news article (requires auth token)
   */
  static deleteNews(newsId: number, token: string) {
    return apiAuthedDELETE<SuccessResponse>(`/smartrotom/documents/news/${newsId}`, token);
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
   * Legacy method: Update active news (requires auth token)
   */
  static updateActiveNews(newsId: number, data: UpdateNewsDto, token: string) {
    return apiAuthedPUT<News>(`/smartrotom/documents/news/${newsId}`, data, token);
  }
}