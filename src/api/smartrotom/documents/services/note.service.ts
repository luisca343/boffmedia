import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@api/_repositories/smartrotom/documents.repository';
import {
  NotePreviewResponse,
  AddNoteToUserRequest,
  RemoveNoteFromUserRequest
} from '@api/smartrotom/documents/types/documents.types';

@Injectable()
export class NoteService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async getUserNotes(uuid: string): Promise<NotePreviewResponse[]> {
    const notes = await this.documentsRepository.findUserDocuments(uuid);
    
    return notes.map(note => ({
      id: note.id,
      title: note.title,
      type: note.type,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt
    }));
  }

  async addNoteToUser(documentId: number, uuid: string): Promise<{ success: boolean }> {
    try {
      // Check if document exists
      const documentExists = await this.documentsRepository.documentExists(documentId);
      if (!documentExists) {
        throw new Error('Document not found');
      }

      // Check if association already exists
      const existingAssociation = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
      if (existingAssociation) {
        throw new Error('User already has access to this document');
      }

      await this.documentsRepository.addDocumentToUser(documentId, uuid);
      return { success: true };
    } catch (error) {
      console.error(`Error adding note ${documentId} to user ${uuid}:`, error);
      throw new Error(`Failed to add note to user: ${error.message}`);
    }
  }

  async removeNoteFromUser(documentId: number, uuid: string): Promise<{ success: boolean }> {
    try {
      // Check if document exists
      const documentExists = await this.documentsRepository.documentExists(documentId);
      if (!documentExists) {
        throw new Error('Document not found');
      }

      // Check if association exists
      const existingAssociation = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
      if (!existingAssociation) {
        throw new Error('User does not have access to this document');
      }

      await this.documentsRepository.removeDocumentFromUser(documentId, uuid);
      return { success: true };
    } catch (error) {
      console.error(`Error removing note ${documentId} from user ${uuid}:`, error);
      throw new Error(`Failed to remove note from user: ${error.message}`);
    }
  }

  async validateUserHasAccess(documentId: number, uuid: string): Promise<boolean> {
    try {
      const association = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
      return !!association;
    } catch (error) {
      console.error(`Error validating user access for document ${documentId} and user ${uuid}:`, error);
      return false;
    }
  }

  async createNoteForUser(title: string, content: string, type: number, uuid: string): Promise<{ id: number; success: boolean }> {
    try {
      // Create the document first
      const result = await this.documentsRepository.createDocument({
        title,
        content,
        type
      });

      const documentId = result.insertId;

      // Associate the document with the user
      await this.documentsRepository.addDocumentToUser(documentId, uuid);

      return {
        id: documentId,
        success: true
      };
    } catch (error) {
      console.error(`Error creating note for user ${uuid}:`, error);
      throw new Error(`Failed to create note for user: ${error.message}`);
    }
  }
}