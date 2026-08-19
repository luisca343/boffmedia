import { rotomGET, rotomPOST, rotomPUT, rotomDELETE, rotomAuthedGET, rotomAuthedPOST, rotomAuthedPUT, rotomAuthedDELETE, apiAuthedPOST, apiAuthedPUT, apiAuthedDELETE } from '@/services/boffAPI';
import type {
  CreateDocumentDto,
  CreateNewsDto,
  UpdateNewsDto,
  NewsStatusDto,
  NewsComment,
  CreateNewsCommentDto,
  NewsletterSubscribeDto,
  EditorialBoardMember,
  NewsIssue,
  ClapResponse,
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
  UpdateFolderDto,
  UpdateTagDto,
  CreateVersionDto,
} from '@boffmedia/shared';

// Local request shapes for the three payloads whose owner uuid moved out of the
// body and into the session. `@boffmedia/shared` is generated from the running
// API, so its copies still carry `uuid` until `pnpm generate:shared` is re-run
// against a rebuilt API — sending that field now fails the global
// ValidationPipe (`forbidNonWhitelisted`), which is exactly the point.
export type CreateFolderDto = {
  name: string;
  color?: string;
  parentId?: number | null;
};
export type CreateTagDto = { label: string; color?: string };

// `public`/`pinned` are real booleans now (the columns were `int` 0/1). The
// generated type still says `number` until `pnpm generate:shared` runs against a
// rebuilt API.
export type UpdateDocumentDto = {
  title?: string;
  content?: string;
  type?: number;
  public?: boolean;
  pinned?: boolean;
  folderId?: number | null;
};

export class DocumentsService {
  // ==================== DOCUMENT OPERATIONS ====================
  
  /**
   * Get a document by ID
   */
  static getDocument(id: number) {
    return rotomAuthedGET<Document>(`/documents/document/${id}`);
  }
  
  /**
   * Create a new document
   */
  static createDocument(data: CreateDocumentDto) {
    return rotomAuthedPOST<Document>('/documents/document', data);
  }
  
  /**
   * Update an existing document
   */
  static updateDocument(id: number, data: UpdateDocumentDto) {
    return rotomAuthedPUT<Document>(`/documents/document/${id}`, data);
  }
  
  /**
   * Delete a document
   */
  static deleteDocument(id: number) {
    return rotomAuthedDELETE<SuccessResponse>(`/documents/document/${id}`);
  }

  // ==================== NOTE OPERATIONS ====================
  
  /**
   * Get all notes for a user
   */
  /** The caller's notes. The owner is taken from the session, not the URL. */
  static getUserNotes() {
    return rotomAuthedGET<NotePreview[]>('/documents/notes');
  }
  
  /**
   * Create a new note
   */
  static createNote(data: CreateDocumentDto) {
    return rotomAuthedPOST<CreateNoteResponse>('/documents/create', data);
  }
  
  /**
   * Save a note
   */
  static saveNote(id: number, data: CreateDocumentDto) {
    return rotomAuthedPOST<SaveDocumentResponse>(`/documents/save/${id}`, data);
  }
  
  /**
   * Add a note to a user
   */
  /** Share a note the caller owns with another player. */
  static addNoteToUser(documentId: number, uuid: string) {
    return rotomAuthedPOST<SuccessResponse>('/documents/note/user', { documentId, uuid });
  }

  /**
   * Remove a note from a user
   */
  static removeNoteFromUser(documentId: number, uuid: string) {
    return rotomAuthedDELETE<SuccessResponse>('/documents/note/user', { documentId, uuid });
  }

  /** List the UUIDs a note is shared with */
  static getDocumentShares(id: number) {
    return rotomAuthedGET<string[]>(`/documents/document/${id}/shares`);
  }

  // ==================== TRASH OPERATIONS ====================

  /** Soft-deleted notes for a user */
  static getTrash() {
    return rotomAuthedGET<NotePreview[]>('/documents/trash');
  }

  /** Restore a soft-deleted note */
  static restoreDocument(id: number) {
    return rotomAuthedPOST<Document>(`/documents/document/${id}/restore`, {});
  }

  /** Permanently delete a note */
  static purgeDocument(id: number) {
    return rotomAuthedDELETE<SuccessResponse>(`/documents/document/${id}/purge`);
  }

  // ==================== FOLDER OPERATIONS ====================

  static getFolders() {
    return rotomAuthedGET<NoteFolder[]>('/documents/folders');
  }

  static createFolder(data: CreateFolderDto) {
    return rotomAuthedPOST<NoteFolder>('/documents/folders', data);
  }

  static updateFolder(id: number, data: UpdateFolderDto) {
    return rotomAuthedPUT<NoteFolder>(`/documents/folders/${id}`, data);
  }

  static deleteFolder(id: number) {
    return rotomAuthedDELETE<SuccessResponse>(`/documents/folders/${id}`);
  }

  // ==================== TAG OPERATIONS ====================

  static getTags() {
    return rotomAuthedGET<NoteTag[]>('/documents/tags');
  }

  static createTag(data: CreateTagDto) {
    return rotomAuthedPOST<NoteTag>('/documents/tags', data);
  }

  static updateTag(id: number, data: UpdateTagDto) {
    return rotomAuthedPUT<SuccessResponse>(`/documents/tags/${id}`, data);
  }

  static deleteTag(id: number) {
    return rotomAuthedDELETE<SuccessResponse>(`/documents/tags/${id}`);
  }

  /** Toggle a tag on a note (adds if absent, removes if present) */
  static toggleNoteTag(documentId: number, tagId: number) {
    return rotomAuthedPOST<{ success: boolean; applied: boolean }>(
      `/documents/document/${documentId}/tag/${tagId}`,
      {},
    );
  }

  // ==================== VERSION OPERATIONS ====================

  static getVersions(documentId: number) {
    return rotomAuthedGET<NoteVersion[]>(`/documents/document/${documentId}/versions`);
  }

  /** Snapshot the current note content as a version */
  static snapshotVersion(documentId: number, data: CreateVersionDto) {
    return rotomAuthedPOST<NoteVersion>(
      `/documents/document/${documentId}/versions`,
      data,
    );
  }

  /** Restore a note to a previous version */
  static restoreVersion(versionId: number) {
    return rotomAuthedPOST<Document>(`/documents/versions/${versionId}/restore`, {});
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
    return rotomAuthedPOST<SuccessResponse>('/documents/newsstatus', data);
  }

  // ==================== FURRET TODAY EDITORIAL ====================
  // Reader comments, claps, the derived masthead and the derived back-issue
  // archive. Added in migration 0025 for the Furret Today magazine redesign.

  /** Reader comments ("viñetas") on an article, newest first */
  static getNewsComments(newsId: number) {
    return rotomGET<NewsComment[]>(`/documents/news/${newsId}/comments`);
  }

  /** Post a reader comment */
  static createNewsComment(newsId: number, data: CreateNewsCommentDto) {
    return rotomPOST<NewsComment>(`/documents/news/${newsId}/comments`, data);
  }

  /** Delete a reader comment */
  static deleteNewsComment(commentId: number) {
    return rotomAuthedDELETE<SuccessResponse>(`/documents/news/comments/${commentId}`);
  }

  /** Applaud an article — increments its clap counter */
  static clapNews(newsId: number) {
    return rotomPOST<ClapResponse>(`/documents/news/${newsId}/clap`, {});
  }

  /**
   * The editorial board — DERIVED by grouping published news on
   * (author, authorRole), not a table.
   */
  static getEditorialBoard() {
    return rotomGET<EditorialBoardMember[]>('/documents/news/board');
  }

  /** The back-issue archive — DERIVED by grouping published news on `issue`. */
  static getNewsIssues() {
    return rotomGET<NewsIssue[]>('/documents/news/issues');
  }

  /** Subscribe an email to the weekly newsletter */
  static subscribeNewsletter(data: NewsletterSubscribeDto) {
    return rotomPOST<SuccessResponse>('/documents/newsletter', data);
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