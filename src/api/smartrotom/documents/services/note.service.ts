import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@api/smartrotom/documents/repositories/documents.repository';

@Injectable()
export class NoteService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async addNoteToUser(documentId: number, uuid: string): Promise<{ success: boolean }> {
    if (!documentId || documentId <= 0) {
      throw new Error('Valid document ID is required');
    }

    if (!uuid) {
      throw new Error('UUID is required');
    }

    // Check if document exists
    const document = await this.documentsRepository.findDocumentById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }

    // Check if association already exists
    const existingAssociation = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
    if (existingAssociation) {
      return { success: true }; 
    }

    await this.documentsRepository.addDocumentToUser(documentId, uuid);
    return { success: true };
  }

  async removeNoteFromUser(documentId: number, uuid: string): Promise<{ success: boolean }> {
    if (!documentId || documentId <= 0) {
      throw new Error('Valid document ID is required');
    }

    if (!uuid) {
      throw new Error('UUID is required');
    }

    const existingAssociation = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
    if (!existingAssociation) {
      throw new Error('User is not associated with this document');
    }

    await this.documentsRepository.removeDocumentFromUser(documentId, uuid);
    return { success: true };
  }

  async validateUserHasAccess(documentId: number, uuid: string): Promise<boolean> {
    const association = await this.documentsRepository.findDocumentUserAssociation(documentId, uuid);
    return !!association;
  }
}