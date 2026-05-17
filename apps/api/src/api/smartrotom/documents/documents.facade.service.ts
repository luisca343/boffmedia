import { Injectable } from '@nestjs/common';
import {
  DocumentService,
  CreateDocumentRequest,
  UpdateDocumentRequest,
} from './services/document.service';
import { NoteService } from './services/note.service';
import {
  NewsService,
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsResponse,
} from './services/news.service';
import { Logger } from 'nestjs-pino';
import {
  DocumentDetails,
  NotePreview,
  NewsDetails,
} from '@api/smartrotom/documents/repositories/documents.repository';

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
    private readonly newsService: NewsService,
  ) {}

  // ==================== DOCUMENT MANAGEMENT ====================

  async getDocumentById(id: number): Promise<DocumentDetails> {
    try {
      return await this.documentService.getDocumentById(id);
    } catch (error: any) {
      this.logger.error(`Error getting document ${id}:`, error);
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
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  async updateDocument(
    id: number,
    updateDocumentRequest: UpdateDocumentRequest,
  ): Promise<DocumentDetails> {
    try {
      return await this.documentService.updateDocument(
        id,
        updateDocumentRequest,
      );
    } catch (error: any) {
      this.logger.error(`Error updating document ${id}:`, error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async deleteDocument(
    id: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.documentService.deleteDocument(id);
      return {
        success: true,
        message: 'Document deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Error deleting document ${id}:`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async saveDocument(
    id: number,
    title: string,
    content: string,
    type: number,
  ): Promise<{ success: boolean; id: number }> {
    try {
      return await this.documentService.saveDocument(id, title, content, type);
    } catch (error: any) {
      this.logger.error(`Error saving document:`, error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  // ==================== NOTE MANAGEMENT ====================

  async getUserNotes(uuid: string): Promise<NotePreview[]> {
    try {
      return await this.documentService.getUserDocuments(uuid);
    } catch (error: any) {
      this.logger.error(`Error getting notes for user ${uuid}:`, error);
      throw new Error(`Failed to retrieve notes: ${error.message}`);
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
      throw new Error(`Failed to remove note from user: ${error.message}`);
    }
  }

  // ==================== NEWS MANAGEMENT ====================

  async getAllNews(): Promise<NewsResponse> {
    try {
      return await this.newsService.getAllNews();
    } catch (error: any) {
      this.logger.error('Error getting all news:', error);
      throw new Error(`Failed to retrieve news: ${error.message}`);
    }
  }

  async getPublishedNews(): Promise<NewsResponse> {
    try {
      return await this.newsService.getPublishedNews();
    } catch (error: any) {
      this.logger.error('Error getting published news:', error);
      throw new Error(`Failed to retrieve published news: ${error.message}`);
    }
  }

  async getNewsById(newsId: number): Promise<NewsDetails> {
    try {
      return await this.newsService.getNewsById(newsId);
    } catch (error: any) {
      this.logger.error(`Error getting news ${newsId}:`, error);
      throw new Error(`Failed to retrieve news: ${error.message}`);
    }
  }

  async getFeaturedNews(): Promise<NewsDetails | null> {
    try {
      return await this.newsService.getFeaturedNews();
    } catch (error: any) {
      this.logger.error('Error getting featured news:', error);
      throw new Error(`Failed to retrieve featured news: ${error.message}`);
    }
  }

  async createNews(createNewsRequest: CreateNewsRequest): Promise<NewsDetails> {
    try {
      return await this.newsService.createNews(createNewsRequest);
    } catch (error: any) {
      this.logger.error('Error creating news:', error);
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
      throw new Error(`Failed to save news: ${error.message}`);
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

  async validateDocumentExists(documentId: number): Promise<boolean> {
    try {
      return await this.documentService.validateDocumentExists(documentId);
    } catch (error: any) {
      this.logger.error(`Error validating document exists:`, error);
      return false;
    }
  }
}
