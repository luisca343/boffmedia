import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@api/_repositories/smartrotom/documents.repository';
import {
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentResponse,
  DocumentDetails,
  DocumentCreationData,
  DocumentUpdateData
} from '@api/smartrotom/documents/types/documents.types';

@Injectable()
export class DocumentService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async getDocumentById(id: number): Promise<DocumentResponse | null> {
    const document = await this.documentsRepository.findDocumentById(id);
    if (!document) {
      return null;
    }

    return {
      id: document.id!,
      title: document.title!,
      type: document.type!,
      content: document.content!,
      createdAt: document.createdAt!,
      updatedAt: document.updatedAt!,
      public: 0 // Default value since not in original schema
    };
  }

  async createDocument(createDocumentRequest: CreateDocumentRequest): Promise<DocumentResponse> {
    const documentData: DocumentCreationData = {
      title: createDocumentRequest.title,
      content: createDocumentRequest.content,
      type: createDocumentRequest.type,
      public: createDocumentRequest.public || 0
    };

    const result = await this.documentsRepository.createDocument(documentData);
    const createdDocument = await this.getDocumentById(result.insertId);

    if (!createdDocument) {
      throw new Error('Failed to retrieve created document');
    }

    return createdDocument;
  }

  async updateDocument(id: number, updateDocumentRequest: UpdateDocumentRequest): Promise<DocumentResponse> {
    const documentExists = await this.documentsRepository.documentExists(id);
    if (!documentExists) {
      throw new Error('Document not found');
    }

    const updateData: DocumentUpdateData = {
      title: updateDocumentRequest.title,
      content: updateDocumentRequest.content,
      type: updateDocumentRequest.type,
      public: updateDocumentRequest.public
    };

    await this.documentsRepository.updateDocument(id, updateData);
    
    const updatedDocument = await this.getDocumentById(id);
    if (!updatedDocument) {
      throw new Error('Failed to retrieve updated document');
    }

    return updatedDocument;
  }

  async deleteDocument(id: number): Promise<void> {
    const documentExists = await this.documentsRepository.documentExists(id);
    if (!documentExists) {
      throw new Error('Document not found');
    }

    await this.documentsRepository.deleteDocument(id);
  }

  async saveDocument(id: number, title: string, content: string, type: number): Promise<number> {
    const documentExists = await this.documentsRepository.documentExists(id);
    
    if (documentExists) {
      // Update existing document
      await this.documentsRepository.updateDocument(id, {
        title,
        content,
        type
      });
      return id;
    } else {
      // Create new document
      const result = await this.documentsRepository.createDocument({
        title,
        content,
        type
      });
      return result.insertId;
    }
  }

  async validateDocumentExists(id: number): Promise<boolean> {
    return this.documentsRepository.documentExists(id);
  }
}