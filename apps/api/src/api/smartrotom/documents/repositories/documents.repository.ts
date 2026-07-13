import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, isNull, isNotNull, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomDocuments,
  rotomDocumentsUsers,
  RotomDocument,
  RotomDocumentUser,
} from '@/_db/schema/SmartRotomDocuments';
import { IDocumentsRepository } from './interfaces/documents.repository.interface';

export interface DocumentDetails {
  id: number;
  title: string;
  content: string;
  type: number;
  public: number;
  pinned: number;
  folderId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewsDetails {
  id: number;
  title: string;
  subtitle: string;
  category: string;
  subcategory: string;
  published: number;
  featured: number;
  content: string;
  buttonText: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
  author: string | null;
  authorRole: string | null;
  issue: number | null;
  claps: number;
}

export interface NotePreview {
  id: number;
  title: string;
  type: number;
  public: number;
  pinned: number;
  folderId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentShare {
  documentId: number;
  uuid: string;
}

interface DocumentMutation {
  title?: string;
  content?: string;
  type?: number;
  public?: number;
  pinned?: number;
  folderId?: number | null;
}

const NOTE_PREVIEW_COLUMNS = {
  id: rotomDocuments.id,
  title: rotomDocuments.title,
  type: rotomDocuments.type,
  public: rotomDocuments.public,
  pinned: rotomDocuments.pinned,
  folderId: rotomDocuments.folderId,
  deletedAt: rotomDocuments.deletedAt,
  createdAt: rotomDocuments.createdAt,
  updatedAt: rotomDocuments.updatedAt,
};

@Injectable()
export class DocumentsRepository implements IDocumentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== DOCUMENT OPERATIONS ====================
  async findDocumentById(id: number): Promise<RotomDocument | null> {
    const result = await this.db
      .select()
      .from(rotomDocuments)
      .where(eq(rotomDocuments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findUserDocuments(uuid: string): Promise<NotePreview[]> {
    return this.db
      .select(NOTE_PREVIEW_COLUMNS)
      .from(rotomDocuments)
      .innerJoin(
        rotomDocumentsUsers,
        eq(rotomDocuments.id, rotomDocumentsUsers.documentId),
      )
      .where(
        and(
          eq(rotomDocumentsUsers.uuid, uuid),
          isNull(rotomDocuments.deletedAt),
        ),
      )
      .orderBy(desc(rotomDocuments.updatedAt));
  }

  async findTrashedDocuments(uuid: string): Promise<NotePreview[]> {
    return this.db
      .select(NOTE_PREVIEW_COLUMNS)
      .from(rotomDocuments)
      .innerJoin(
        rotomDocumentsUsers,
        eq(rotomDocuments.id, rotomDocumentsUsers.documentId),
      )
      .where(
        and(
          eq(rotomDocumentsUsers.uuid, uuid),
          isNotNull(rotomDocuments.deletedAt),
        ),
      )
      .orderBy(desc(rotomDocuments.updatedAt));
  }

  async createDocument(documentData: {
    title: string;
    content: string;
    type: number;
    public?: number;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocuments).values({
      ...documentData,
      public: documentData.public || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    return { insertId: result[0].insertId };
  }

  async updateDocument(
    id: number,
    documentData: DocumentMutation,
  ): Promise<void> {
    await this.db
      .update(rotomDocuments)
      .set({
        ...documentData,
        updatedAt: new Date(),
      } as Partial<RotomDocument>)
      .where(eq(rotomDocuments.id, id));
  }

  async softDeleteDocument(id: number): Promise<void> {
    await this.db
      .update(rotomDocuments)
      .set({ deletedAt: new Date() } as Partial<RotomDocument>)
      .where(eq(rotomDocuments.id, id));
  }

  async restoreDocument(id: number): Promise<void> {
    await this.db
      .update(rotomDocuments)
      .set({ deletedAt: null } as Partial<RotomDocument>)
      .where(eq(rotomDocuments.id, id));
  }

  async deleteDocument(id: number): Promise<void> {
    await this.db.delete(rotomDocuments).where(eq(rotomDocuments.id, id));
  }

  // ==================== DOCUMENT-USER ASSOCIATION OPERATIONS ====================
  async findDocumentUserAssociation(
    documentId: number,
    uuid: string,
  ): Promise<RotomDocumentUser | null> {
    const result = await this.db
      .select()
      .from(rotomDocumentsUsers)
      .where(
        and(
          eq(rotomDocumentsUsers.documentId, documentId),
          eq(rotomDocumentsUsers.uuid, uuid),
        ),
      )
      .limit(1);
    return result[0] || null;
  }

  async findDocumentShares(documentId: number): Promise<DocumentShare[]> {
    return this.db
      .select({
        documentId: rotomDocumentsUsers.documentId,
        uuid: rotomDocumentsUsers.uuid,
      })
      .from(rotomDocumentsUsers)
      .where(eq(rotomDocumentsUsers.documentId, documentId));
  }

  async findSharesByDocumentIds(ids: number[]): Promise<DocumentShare[]> {
    if (ids.length === 0) return [];
    return this.db
      .select({
        documentId: rotomDocumentsUsers.documentId,
        uuid: rotomDocumentsUsers.uuid,
      })
      .from(rotomDocumentsUsers)
      .where(inArray(rotomDocumentsUsers.documentId, ids));
  }

  async addDocumentToUser(
    documentId: number,
    uuid: string,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocumentsUsers).values({
      documentId,
      uuid,
    } as RotomDocumentUser);
    return { insertId: result[0].insertId };
  }

  async removeDocumentFromUser(
    documentId: number,
    uuid: string,
  ): Promise<void> {
    await this.db
      .delete(rotomDocumentsUsers)
      .where(
        and(
          eq(rotomDocumentsUsers.documentId, documentId),
          eq(rotomDocumentsUsers.uuid, uuid),
        ),
      );
  }
}
