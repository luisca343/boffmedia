import { Injectable } from '@nestjs/common';
import { DocumentService } from './services/document.service';
import { NoteService } from './services/note.service';
import { NewsService } from './services/news.service';
import {
  CreateDocumentRequest,
  CreateDocumentResponse,
  UpdateDocumentRequest,
  UpdateDocumentResponse,
  DeleteDocumentResponse,
  DocumentResponse,
  SaveDocumentResponse,
  CreateNoteWithUserRequest,
  CreateNoteWithUserResponse,
  GetUserNotesRequest,
  GetUserNotesResponse,
  AddNoteToUserRequest,
  AddNoteToUserResponse,
  RemoveNoteFromUserRequest,
  RemoveNoteFromUserResponse,
  CreateNewsRequest,
  CreateNewsResponse,
  UpdateNewsRequest,
  UpdateNewsResponse,
  DeleteNewsResponse,
  GetAllNewsResponse,
  GetPublishedNewsResponse,
  NewsResponse,
  UpdateNewsStatusRequest,
  UpdateNewsStatusResponse,
  SaveNewsRequest,
  SaveNewsResponse
} from '@api/smartrotom/documents/types/documents.types';

@Injectable()
export class DocumentsFacadeService {
  constructor(
    private readonly documentService: DocumentService,
    private readonly noteService: NoteService,
    private readonly newsService: NewsService,
  ) {}

  // ==================== DOCUMENT MANAGEMENT ====================

  async getDocumentById(id: number): Promise<DocumentResponse | null> {
    try {
      return await this.documentService.getDocumentById(id);
    } catch (error) {
      console.error(`Error getting document ${id}:`, error);
      throw new Error(`Failed to retrieve document: ${error.message}`);
    }
  }

  async createDocument(createDocumentRequest: CreateDocumentRequest): Promise<CreateDocumentResponse> {
    try {
      return await this.documentService.createDocument(createDocumentRequest);
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  async updateDocument(id: number, updateDocumentRequest: UpdateDocumentRequest): Promise<UpdateDocumentResponse> {
    try {
      return await this.documentService.updateDocument(id, updateDocumentRequest);
    } catch (error) {
      console.error(`Error updating document ${id}:`, error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  async deleteDocument(id: number): Promise<DeleteDocumentResponse> {
    try {
      await this.documentService.deleteDocument(id);
      return {
        success: true,
        message: 'Document deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting document ${id}:`, error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  async saveDocument(id: number, title: string, content: string, type: number): Promise<SaveDocumentResponse> {
    try {
      const documentId = await this.documentService.saveDocument(id, title, content, type);
      return {
        success: true,
        id: documentId
      };
    } catch (error) {
      console.error(`Error saving document ${id}:`, error);
      throw new Error(`Failed to save document: ${error.message}`);
    }
  }

  // ==================== NOTE MANAGEMENT ====================

  async getUserNotes(getUserNotesRequest: GetUserNotesRequest): Promise<GetUserNotesResponse> {
    try {
      const notes = await this.noteService.getUserNotes(getUserNotesRequest.uuid);
      return { notes };
    } catch (error) {
      console.error(`Error getting notes for user ${getUserNotesRequest.uuid}:`, error);
      throw new Error(`Failed to retrieve user notes: ${error.message}`);
    }
  }

  async createNoteWithUser(createNoteRequest: CreateNoteWithUserRequest): Promise<CreateNoteWithUserResponse> {
    try {
      const result = await this.noteService.createNoteForUser(
        createNoteRequest.title,
        createNoteRequest.content,
        createNoteRequest.type,
        createNoteRequest.uuid
      );

      return {
        id: result.id,
        success: result.success
      };
    } catch (error) {
      console.error(`Error creating note for user ${createNoteRequest.uuid}:`, error);
      throw new Error(`Failed to create note with user: ${error.message}`);
    }
  }

  async addNoteToUser(addNoteRequest: AddNoteToUserRequest): Promise<AddNoteToUserResponse> {
    try {
      return await this.noteService.addNoteToUser(addNoteRequest.documentId, addNoteRequest.uuid);
    } catch (error) {
      console.error(`Error adding note ${addNoteRequest.documentId} to user ${addNoteRequest.uuid}:`, error);
      throw new Error(`Failed to add note to user: ${error.message}`);
    }
  }

  async removeNoteFromUser(removeNoteRequest: RemoveNoteFromUserRequest): Promise<RemoveNoteFromUserResponse> {
    try {
      return await this.noteService.removeNoteFromUser(removeNoteRequest.documentId, removeNoteRequest.uuid);
    } catch (error) {
      console.error(`Error removing note ${removeNoteRequest.documentId} from user ${removeNoteRequest.uuid}:`, error);
      throw new Error(`Failed to remove note from user: ${error.message}`);
    }
  }

  // ==================== NEWS MANAGEMENT ====================

  async getAllNews(): Promise<GetAllNewsResponse> {
    try {
      return await this.newsService.getAllNews();
    } catch (error) {
      console.error('Error getting all news:', error);
      throw new Error(`Failed to retrieve all news: ${error.message}`);
    }
  }

  async getPublishedNews(): Promise<GetPublishedNewsResponse> {
    try {
      return await this.newsService.getPublishedNews();
    } catch (error) {
      console.error('Error getting published news:', error);
      throw new Error(`Failed to retrieve published news: ${error.message}`);
    }
  }

  async getNewsById(newsId: number): Promise<NewsResponse | null> {
    try {
      return await this.newsService.getNewsById(newsId);
    } catch (error) {
      console.error(`Error getting news ${newsId}:`, error);
      throw new Error(`Failed to retrieve news: ${error.message}`);
    }
  }

  async getFeaturedNews(): Promise<NewsResponse | null> {
    try {
      return await this.newsService.getFeaturedNews();
    } catch (error) {
      console.error('Error getting featured news:', error);
      throw new Error(`Failed to retrieve featured news: ${error.message}`);
    }
  }

  async createNews(createNewsRequest: CreateNewsRequest): Promise<CreateNewsResponse> {
    try {
      return await this.newsService.createNews(createNewsRequest);
    } catch (error) {
      console.error('Error creating news:', error);
      throw new Error(`Failed to create news: ${error.message}`);
    }
  }

  async updateNews(newsId: number, updateNewsRequest: UpdateNewsRequest): Promise<UpdateNewsResponse> {
    try {
      return await this.newsService.updateNews(newsId, updateNewsRequest);
    } catch (error) {
      console.error(`Error updating news ${newsId}:`, error);
      throw new Error(`Failed to update news: ${error.message}`);
    }
  }

  async deleteNews(newsId: number): Promise<DeleteNewsResponse> {
    try {
      await this.newsService.deleteNews(newsId);
      return {
        success: true,
        message: 'News deleted successfully'
      };
    } catch (error) {
      console.error(`Error deleting news ${newsId}:`, error);
      throw new Error(`Failed to delete news: ${error.message}`);
    }
  }

  async updateNewsStatus(updateStatusRequest: UpdateNewsStatusRequest): Promise<UpdateNewsStatusResponse> {
    try {
      const result = await this.newsService.updateNewsStatus(updateStatusRequest);
      return { success: result.success };
    } catch (error) {
      console.error('Error updating news status:', error);
      throw new Error(`Failed to update news status: ${error.message}`);
    }
  }

  async saveNews(saveNewsRequest: SaveNewsRequest): Promise<SaveNewsResponse> {
    try {
      const result = await this.newsService.saveNews(saveNewsRequest.news, saveNewsRequest.newsId);
      return {
        success: result.success,
        id: result.id
      };
    } catch (error) {
      console.error(`Error saving news:`, error);
      throw new Error(`Failed to save news: ${error.message}`);
    }
  }

  // ==================== VALIDATION METHODS ====================

  async validateDocumentExists(id: number): Promise<boolean> {
    try {
      return await this.documentService.validateDocumentExists(id);
    } catch (error) {
      console.error(`Error validating document existence for ${id}:`, error);
      return false;
    }
  }

  async validateNewsExists(newsId: number): Promise<boolean> {
    try {
      return await this.newsService.validateNewsExists(newsId);
    } catch (error) {
      console.error(`Error validating news existence for ${newsId}:`, error);
      return false;
    }
  }

  async validateUserHasNoteAccess(documentId: number, uuid: string): Promise<boolean> {
    try {
      return await this.noteService.validateUserHasAccess(documentId, uuid);
    } catch (error) {
      console.error(`Error validating user note access for document ${documentId} and user ${uuid}:`, error);
      return false;
    }
  }
}