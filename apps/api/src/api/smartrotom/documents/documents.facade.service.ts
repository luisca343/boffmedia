import { NotFoundException, HttpException, Injectable } from '@nestjs/common';
import {
  DocumentService,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from './services/document.service';
import { NoteService } from './services/note.service';
import {
  NoteOrganizationService,
  CreateFolderRequest,
  CreateTagRequest,
} from './services/note-organization.service';
import {
  NewsService,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsResponse,
} from './services/news.service';
import {
  NewsCommentRow,
  EditorialBoardRow,
  NewsIssueRow,
} from './repositories/interfaces/news.repository.interface';
import { Logger } from 'nestjs-pino';
import {
  DocumentDetails,
  NotePreview as NotePreviewRow,
  NewsDetails,
} from '@api/smartrotom/documents/repositories/documents.repository';
import {
  FolderRow,
  TagRow,
  VersionRow,
} from './repositories/interfaces/note-organization.repository.interface';
import { NotePreview } from './entities/document.entity';

export interface CreateNoteWithUserRequest {
  title: string;
  content: string;
  type: number;
  uuid: string;
}

@Injectable()
export class DocumentsFacadeService {
  constructor(
    private readonly logger: Logger,

    private readonly documentService: DocumentService,
    private readonly noteService: NoteService,
    private readonly noteOrganizationService: NoteOrganizationService,
    private readonly newsService: NewsService,
  ) {}

  // Merge folder/pin metadata from rotom_documents with tag links and shares
  // into the enriched NotePreview the client renders (sidebar + list) with no
  // per-note round-trips.
  //
  // `rotom_user_documents` is the ACCESS list, and the author's own row lives
  // in it too (createNoteWithUser writes it). `sharedWith` means "shared with
  // OTHERS", so the viewer's own row is dropped here — otherwise every note the
  // viewer owns looks shared with themselves.
  private async enrichNotes(
    rows: NotePreviewRow[],
    viewerUuid: string,
  ): Promise<NotePreview[]> {
    const ids = rows.map((r) => r.id);
    const [tagLinks, shares] = await Promise.all([
      this.noteOrganizationService.getTagLinksForDocuments(ids),
      this.noteService.getSharesForDocuments(ids),
    ]);

    const tagsByDoc = new Map<number, number[]>();
    for (const link of tagLinks) {
      const list = tagsByDoc.get(link.documentId) ?? [];
      list.push(link.tagId);
      tagsByDoc.set(link.documentId, list);
    }

    const sharesByDoc = new Map<number, string[]>();
    for (const share of shares) {
      if (share.uuid === viewerUuid) continue;
      const list = sharesByDoc.get(share.documentId) ?? [];
      list.push(share.uuid);
      sharesByDoc.set(share.documentId, list);
    }

    return rows.map((row) => ({
      ...row,
      tags: tagsByDoc.get(row.id) ?? [],
      sharedWith: sharesByDoc.get(row.id) ?? [],
    }));
  }

  // ==================== DOCUMENT MANAGEMENT ====================

  async getDocumentById(
    id: number,
    requesterUuid?: string,
  ): Promise<DocumentDetails> {
    try {
      return await this.documentService.getDocumentById(id, requesterUuid);
    } catch (error: any) {
      this.logger.error(`Error getting document ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  async createDocument(
    createDocumentRequest: CreateDocumentRequest,
  ): Promise<DocumentDetails> {
    try {
      return await this.documentService.createDocument(createDocumentRequest);
    } catch (error: any) {
      this.logger.error('Error creating document:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  async updateDocument(
    id: number,
    ownerUuid: string,
    updateDocumentRequest: UpdateDocumentRequest,
  ): Promise<DocumentDetails> {
    try {
      return await this.documentService.updateDocument(
        id,
        ownerUuid,
        updateDocumentRequest,
      );
    } catch (error: any) {
      this.logger.error(`Error updating document ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async deleteDocument(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.documentService.deleteDocument(id, ownerUuid);
      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error deleting document ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async saveDocument(
    id: number,
    ownerUuid: string,
    title: string,
    content: string,
    type: number,
  ): Promise<{ success: boolean; id: number }> {
    try {
      return await this.documentService.saveDocument(
        id,
        ownerUuid,
        title,
        content,
        type,
      );
    } catch (error: any) {
      this.logger.error(`Error saving document:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  // ==================== NOTE MANAGEMENT ====================

  async getUserNotes(uuid: string): Promise<NotePreview[]> {
    try {
      const rows = await this.documentService.getUserDocuments(uuid);
      return await this.enrichNotes(rows, uuid);
    } catch (error: any) {
      this.logger.error(`Error getting notes for user ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve notes: ${error.message}`);
    }
  }

  async getTrashedNotes(uuid: string): Promise<NotePreview[]> {
    try {
      const rows = await this.documentService.getTrashedDocuments(uuid);
      return await this.enrichNotes(rows, uuid);
    } catch (error: any) {
      this.logger.error(`Error getting trash for user ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve trash: ${error.message}`);
    }
  }

  async restoreDocument(
    id: number,
    ownerUuid: string,
  ): Promise<DocumentDetails> {
    try {
      return await this.documentService.restoreDocument(id, ownerUuid);
    } catch (error: any) {
      this.logger.error(`Error restoring document ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to restore document: ${error.message}`);
    }
  }

  async purgeDocument(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.documentService.purgeDocument(id, ownerUuid);
      return { success: true, message: 'Document permanently deleted' };
    } catch (error: any) {
      this.logger.error(`Error purging document ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async getDocumentShares(documentId: number): Promise<string[]> {
    try {
      return await this.noteService.getShares(documentId);
    } catch (error: any) {
      this.logger.error(`Error getting shares for ${documentId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve shares: ${error.message}`);
    }
  }

  // ==================== FOLDERS ====================

  async getFolders(uuid: string): Promise<FolderRow[]> {
    try {
      return await this.noteOrganizationService.getFolders(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting folders for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve folders: ${error.message}`);
    }
  }

  async createFolder(req: CreateFolderRequest): Promise<FolderRow> {
    try {
      return await this.noteOrganizationService.createFolder(req);
    } catch (error: any) {
      this.logger.error('Error creating folder:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  async updateFolder(
    id: number,
    ownerUuid: string,
    data: { name?: string; color?: string; parentId?: number | null },
  ): Promise<FolderRow> {
    try {
      return await this.noteOrganizationService.updateFolder(
        id,
        ownerUuid,
        data,
      );
    } catch (error: any) {
      this.logger.error(`Error updating folder ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update folder: ${error.message}`);
    }
  }

  async deleteFolder(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.noteOrganizationService.deleteFolder(id, ownerUuid);
    } catch (error: any) {
      this.logger.error(`Error deleting folder ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete folder: ${error.message}`);
    }
  }

  // ==================== TAGS ====================

  async getTags(uuid: string): Promise<TagRow[]> {
    try {
      return await this.noteOrganizationService.getTags(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting tags for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve tags: ${error.message}`);
    }
  }

  async createTag(req: CreateTagRequest): Promise<TagRow> {
    try {
      return await this.noteOrganizationService.createTag(req);
    } catch (error: any) {
      this.logger.error('Error creating tag:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create tag: ${error.message}`);
    }
  }

  async updateTag(
    id: number,
    ownerUuid: string,
    data: { label?: string; color?: string },
  ): Promise<{ success: boolean }> {
    try {
      return await this.noteOrganizationService.updateTag(id, ownerUuid, data);
    } catch (error: any) {
      this.logger.error(`Error updating tag ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update tag: ${error.message}`);
    }
  }

  async deleteTag(
    id: number,
    ownerUuid: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.noteOrganizationService.deleteTag(id, ownerUuid);
    } catch (error: any) {
      this.logger.error(`Error deleting tag ${id}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete tag: ${error.message}`);
    }
  }

  async toggleNoteTag(
    documentId: number,
    tagId: number,
  ): Promise<{ success: boolean; applied: boolean }> {
    try {
      return await this.noteOrganizationService.toggleTag(documentId, tagId);
    } catch (error: any) {
      this.logger.error(`Error toggling tag ${tagId} on ${documentId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to toggle tag: ${error.message}`);
    }
  }

  // ==================== VERSIONS ====================

  async getVersions(documentId: number): Promise<VersionRow[]> {
    try {
      return await this.noteOrganizationService.getVersions(documentId);
    } catch (error: any) {
      this.logger.error(`Error getting versions for ${documentId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve versions: ${error.message}`);
    }
  }

  async snapshotVersion(
    documentId: number,
    label?: string,
    authorUuid?: string,
  ): Promise<VersionRow> {
    try {
      const document = await this.documentService.getDocumentById(documentId);
      return await this.noteOrganizationService.createVersion({
        documentId,
        content: document.content,
        label,
        authorUuid,
      });
    } catch (error: any) {
      this.logger.error(`Error snapshotting ${documentId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to snapshot note: ${error.message}`);
    }
  }

  // Snapshots the current content first (so nothing is lost), then restores the
  // chosen version's content onto the live document.
  async restoreVersion(
    versionId: number,
    ownerUuid: string,
  ): Promise<DocumentDetails> {
    try {
      const version = await this.noteOrganizationService.getVersion(versionId);
      if (!version) {
        throw new NotFoundException('Versión no encontrada');
      }
      await this.snapshotVersion(version.documentId, 'Antes de restaurar');
      // updateDocument re-checks ownership of the document the version belongs
      // to, so restoring someone else's version is rejected there.
      return await this.documentService.updateDocument(
        version.documentId,
        ownerUuid,
        { content: version.content },
      );
    } catch (error: any) {
      this.logger.error(`Error restoring version ${versionId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to restore version: ${error.message}`);
    }
  }

  async createNoteWithUser(
    createNoteRequest: CreateNoteWithUserRequest,
  ): Promise<{ id: number; success: boolean }> {
    try {
      const document = await this.documentService.createDocument({
        title: createNoteRequest.title,
        content: createNoteRequest.content,
        type: createNoteRequest.type,
      });

      await this.noteService.addNoteToUser(document.id, createNoteRequest.uuid);

      return { id: document.id, success: true };
    } catch (error: any) {
      this.logger.error('Error creating note with user:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create note: ${error.message}`);
    }
  }

  async addNoteToUser(
    documentId: number,
    uuid: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.noteService.addNoteToUser(documentId, uuid);
    } catch (error: any) {
      this.logger.error(
        `Error adding note ${documentId} to user ${uuid}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to add note to user: ${error.message}`);
    }
  }

  async removeNoteFromUser(
    documentId: number,
    uuid: string,
  ): Promise<{ success: boolean }> {
    try {
      return await this.noteService.removeNoteFromUser(documentId, uuid);
    } catch (error: any) {
      this.logger.error(
        `Error removing note ${documentId} from user ${uuid}:`,
        error,
      );
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to remove note from user: ${error.message}`);
    }
  }

  // ==================== NEWS MANAGEMENT ====================

  async getAllNews(): Promise<NewsResponse> {
    try {
      return await this.newsService.getAllNews();
    } catch (error: any) {
      this.logger.error('Error getting all news:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve news: ${error.message}`);
    }
  }

  async getPublishedNews(): Promise<NewsResponse> {
    try {
      return await this.newsService.getPublishedNews();
    } catch (error: any) {
      this.logger.error('Error getting published news:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve published news: ${error.message}`);
    }
  }

  async getNewsById(newsId: number): Promise<NewsDetails> {
    try {
      return await this.newsService.getNewsById(newsId);
    } catch (error: any) {
      this.logger.error(`Error getting news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve news: ${error.message}`);
    }
  }

  /**
   * The reader-facing lookup. `getNewsById` cannot itself refuse drafts — it is
   * what `createNews` calls to return the article it just made, which is
   * unpublished by definition — so the published check lives here, on the path
   * the @Public() route uses. Without it, ids are sequential integers and every
   * draft is one guess away.
   *
   * 404 rather than 403: to an anonymous reader an unpublished article should
   * not exist, and 403 would confirm that the id is real.
   */
  async getPublishedNewsById(newsId: number): Promise<NewsDetails> {
    const news = await this.getNewsById(newsId);
    if (!news.published) {
      throw new NotFoundException(`News ${newsId} not found`);
    }
    return news;
  }

  async getFeaturedNews(): Promise<NewsDetails | null> {
    try {
      return await this.newsService.getFeaturedNews();
    } catch (error: any) {
      this.logger.error('Error getting featured news:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve featured news: ${error.message}`);
    }
  }

  async createNews(createNewsRequest: CreateNewsRequest): Promise<NewsDetails> {
    try {
      return await this.newsService.createNews(createNewsRequest);
    } catch (error: any) {
      this.logger.error('Error creating news:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to create news: ${error.message}`);
    }
  }

  async updateNews(
    newsId: number,
    updateNewsRequest: UpdateNewsRequest,
  ): Promise<NewsDetails> {
    try {
      return await this.newsService.updateNews(newsId, updateNewsRequest);
    } catch (error: any) {
      this.logger.error(`Error updating news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update news: ${error.message}`);
    }
  }

  async deleteNews(
    newsId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.newsService.deleteNews(newsId);
      return {
        success: true,
        message: 'News deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error deleting news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete news: ${error.message}`);
    }
  }

  async updateNewsStatus(
    publishedIds: number[],
    featuredId: number,
  ): Promise<{ success: boolean }> {
    try {
      return await this.newsService.updateNewsStatus(publishedIds, featuredId);
    } catch (error: any) {
      this.logger.error('Error updating news status:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to update news status: ${error.message}`);
    }
  }

  async saveNews(
    news: CreateNewsRequest,
    newsId: number,
  ): Promise<{ success: boolean; id: number }> {
    try {
      return await this.newsService.saveNews(news, newsId);
    } catch (error: any) {
      this.logger.error('Error saving news:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to save news: ${error.message}`);
    }
  }

  // ==================== NEWS COMMENTS ====================

  async getNewsComments(newsId: number): Promise<NewsCommentRow[]> {
    try {
      return await this.newsService.getComments(newsId);
    } catch (error: any) {
      this.logger.error(`Error getting comments for news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve comments: ${error.message}`);
    }
  }

  async addNewsComment(
    newsId: number,
    uuid: string,
    body: string,
  ): Promise<NewsCommentRow> {
    try {
      return await this.newsService.addComment(newsId, uuid, body);
    } catch (error: any) {
      this.logger.error(`Error adding comment to news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to add comment: ${error.message}`);
    }
  }

  async deleteNewsComment(
    commentId: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.newsService.removeComment(commentId);
      return { success: true, message: 'Comment deleted successfully' };
    } catch (error: any) {
      this.logger.error(`Error deleting comment ${commentId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  // ==================== NEWS CLAPS ====================

  async clapNews(newsId: number): Promise<{ id: number; claps: number }> {
    try {
      return await this.newsService.clapNews(newsId);
    } catch (error: any) {
      this.logger.error(`Error clapping news ${newsId}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to clap news: ${error.message}`);
    }
  }

  // ==================== EDITORIAL BOARD & ISSUES ====================

  async getEditorialBoard(): Promise<EditorialBoardRow[]> {
    try {
      return await this.newsService.getEditorialBoard();
    } catch (error: any) {
      this.logger.error('Error getting editorial board:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve editorial board: ${error.message}`);
    }
  }

  async getNewsIssues(): Promise<NewsIssueRow[]> {
    try {
      return await this.newsService.getIssues();
    } catch (error: any) {
      this.logger.error('Error getting news issues:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to retrieve news issues: ${error.message}`);
    }
  }

  // ==================== NEWSLETTER ====================

  async subscribeNewsletter(email: string): Promise<{ success: boolean }> {
    try {
      return await this.newsService.subscribeNewsletter(email);
    } catch (error: any) {
      this.logger.error('Error subscribing to newsletter:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Failed to subscribe to newsletter: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateDocumentAccess(
    documentId: number,
    uuid: string,
  ): Promise<boolean> {
    try {
      return await this.noteService.validateUserHasAccess(documentId, uuid);
    } catch (error: any) {
      this.logger.error(`Error validating document access:`, error);
      return false;
    }
  }
}
