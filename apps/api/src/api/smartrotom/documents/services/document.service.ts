import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DOCUMENTS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';
import { IDocumentsRepository } from '../repositories/interfaces/documents.repository.interface';
import {
  DocumentDetails,
  NotePreview,
} from '../repositories/documents.repository';

export interface CreateDocumentRequest {
  title: string;
  content: string;
  type: number;
  public?: boolean;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
  type?: number;
  public?: boolean;
  pinned?: boolean;
  folderId?: number | null;
}

/**
 * Notes.
 *
 * Every mutating method takes the OWNER's uuid and proves the caller holds a
 * `rotom_user_documents` row for that note before touching it. Taking an id
 * alone and checking only that the row exists lets any caller edit, trash or
 * permanently purge anyone else's notes by guessing an integer. The owner uuid
 * comes from the JWT, never from the request.
 */
@Injectable()
export class DocumentService {
  constructor(
    @Inject(DOCUMENTS_REPOSITORY_TOKEN)
    private readonly documentsRepository: IDocumentsRepository,
  ) {}

  /** Throws unless `ownerUuid` holds this document. */
  private async assertOwner(id: number, ownerUuid: string): Promise<void> {
    const link = await this.documentsRepository.findDocumentUserAssociation(
      id,
      ownerUuid,
    );
    if (!link) {
      throw new ForbiddenException('Esta nota no te pertenece');
    }
  }

  private async requireDocument(id: number): Promise<DocumentDetails> {
    if (!id || id <= 0) {
      throw new BadRequestException('Identificador de nota inválido');
    }
    const document = await this.documentsRepository.findDocumentById(id);
    if (!document) {
      throw new NotFoundException('Nota no encontrada');
    }
    return document;
  }

  /**
   * A note is readable by its holders, or by anyone when it is explicitly
   * public. `public` is the only path that does not require ownership.
   */
  async getDocumentById(
    id: number,
    requesterUuid?: string,
  ): Promise<DocumentDetails> {
    const document = await this.requireDocument(id);
    if (document.public) return document;

    if (!requesterUuid) {
      throw new ForbiddenException('Esta nota es privada');
    }
    await this.assertOwner(id, requesterUuid);
    return document;
  }

  async getUserDocuments(uuid: string): Promise<NotePreview[]> {
    return this.documentsRepository.findUserDocuments(uuid);
  }

  async getTrashedDocuments(uuid: string): Promise<NotePreview[]> {
    return this.documentsRepository.findTrashedDocuments(uuid);
  }

  async createDocument(
    createDocumentRequest: CreateDocumentRequest,
  ): Promise<DocumentDetails> {
    const { title, content, type, public: isPublic } = createDocumentRequest;

    if (!title || !content) {
      throw new BadRequestException('Título y contenido son obligatorios');
    }

    if (type === undefined || type === null) {
      throw new BadRequestException('El tipo de nota es obligatorio');
    }

    const result = await this.documentsRepository.createDocument({
      title: title.trim(),
      content: content.trim(),
      type,
      public: isPublic ?? false,
    });

    return this.requireDocument(result.insertId);
  }

  async updateDocument(
    id: number,
    ownerUuid: string,
    updateDocumentRequest: UpdateDocumentRequest,
  ): Promise<DocumentDetails> {
    await this.requireDocument(id);
    await this.assertOwner(id, ownerUuid);

    const updateData: UpdateDocumentRequest = {};

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

    if (updateDocumentRequest.pinned !== undefined) {
      updateData.pinned = updateDocumentRequest.pinned;
    }

    if (updateDocumentRequest.folderId !== undefined) {
      updateData.folderId = updateDocumentRequest.folderId;
    }

    await this.documentsRepository.updateDocument(id, updateData);
    return this.requireDocument(id);
  }

  // Soft delete: moves the document to the trash (recoverable).
  async deleteDocument(id: number, ownerUuid: string): Promise<void> {
    await this.requireDocument(id);
    await this.assertOwner(id, ownerUuid);
    await this.documentsRepository.softDeleteDocument(id);
  }

  async restoreDocument(
    id: number,
    ownerUuid: string,
  ): Promise<DocumentDetails> {
    await this.requireDocument(id);
    await this.assertOwner(id, ownerUuid);
    await this.documentsRepository.restoreDocument(id);
    return this.requireDocument(id);
  }

  // Permanent removal (cascades to tags/versions/shares via FKs).
  async purgeDocument(id: number, ownerUuid: string): Promise<void> {
    await this.requireDocument(id);
    await this.assertOwner(id, ownerUuid);
    await this.documentsRepository.deleteDocument(id);
  }

  /** `id === 0` creates; the caller is responsible for linking a new note. */
  async saveDocument(
    id: number,
    ownerUuid: string,
    title: string,
    content: string,
    type: number,
  ): Promise<{ success: boolean; id: number }> {
    if (id === 0) {
      const newDocument = await this.createDocument({ title, content, type });
      await this.documentsRepository.addDocumentToUser(
        newDocument.id,
        ownerUuid,
      );
      return { success: true, id: newDocument.id };
    }

    const updatedDocument = await this.updateDocument(id, ownerUuid, {
      title,
      content,
      type,
    });
    return { success: true, id: updatedDocument.id };
  }
}
