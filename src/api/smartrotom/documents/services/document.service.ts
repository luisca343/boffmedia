import { Injectable, Inject } from '@nestjs/common';
import { DOCUMENTS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';
import { IDocumentsRepository } from '../repositories/interfaces/documents.repository.interface';
import { DocumentDetails, NotePreview } from '../repositories/documents.repository';

export interface CreateDocumentRequest {
  title: string;
  content: string;
  type: number;
  public?: number;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  type?: number;
  public?: number;
}

@Injectable()
export class DocumentService {
  constructor(
    @Inject(DOCUMENTS_REPOSITORY_TOKEN)
    private readonly documentsRepository: IDocumentsRepository,
  ) {}

  async getDocumentById(id: number): Promise<DocumentDetails> {
    if (!id || id <= 0) {
      throw new Error('Valid document ID is required');
    }

    const document = await this.documentsRepository.findDocumentById(id);
    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  async getUserDocuments(uuid: string): Promise<NotePreview[]> {
    if (!uuid) {
      throw new Error('UUID is required');
    }

    return this.documentsRepository.findUserDocuments(uuid);
  }

  async createDocument(createDocumentRequest: CreateDocumentRequest): Promise<DocumentDetails> {
    const { title, content, type, public: isPublic } = createDocumentRequest;

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    if (type === undefined || type === null) {
      throw new Error('Document type is required');
    }

    const result = await this.documentsRepository.createDocument({
      title: title.trim(),
      content: content.trim(),
      type,
      public: isPublic || 0
    });

    return this.getDocumentById(result.insertId);
  }

  async updateDocument(id: number, updateDocumentRequest: UpdateDocumentRequest): Promise<DocumentDetails> {
    const existingDocument = await this.documentsRepository.findDocumentById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    const updateData: any = {};
    
    if (updateDocumentRequest.title !== undefined) {
      updateData.title = updateDocumentRequest.title.trim();
    }
    
    if (updateDocumentRequest.content !== undefined) {
      updateData.content = updateDocumentRequest.content.trim();
    }
    
    if (updateDocumentRequest.type !== undefined) {
      updateData.type = updateDocumentRequest.type;
    }
    
    if (updateDocumentRequest.public !== undefined) {
      updateData.public = updateDocumentRequest.public;
    }

    await this.documentsRepository.updateDocument(id, updateData);
    return this.getDocumentById(id);
  }

  async deleteDocument(id: number): Promise<void> {
    const existingDocument = await this.documentsRepository.findDocumentById(id);
    if (!existingDocument) {
      throw new Error('Document not found');
    }

    await this.documentsRepository.deleteDocument(id);
  }

  async saveDocument(id: number, title: string, content: string, type: number): Promise<{ success: boolean; id: number }> {
    // Legacy method for backward compatibility
    if (id === 0) {
      const newDocument = await this.createDocument({ title, content, type });
      return { success: true, id: newDocument.id };
    } else {
      const updatedDocument = await this.updateDocument(id, { title, content, type });
      return { success: true, id: updatedDocument.id };
    }
  }

  async validateDocumentExists(id: number): Promise<boolean> {
    try {
      await this.getDocumentById(id);
      return true;
    } catch {
      return false;
    }
  }
}