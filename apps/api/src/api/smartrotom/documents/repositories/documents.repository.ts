import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
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
}

export interface NotePreview {
  id: number;
  title: string;
  type: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class DocumentsRepository implements IDocumentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== DOCUMENT OPERATIONS ====================
  async findDocumentById(id: number): Promise<RotomDocument | null> {
    const result = await this.db
      .select({
        id: rotomDocuments.id,
        title: rotomDocuments.title,
        content: rotomDocuments.content,
        type: rotomDocuments.type,
        createdAt: rotomDocuments.createdAt,
        updatedAt: rotomDocuments.updatedAt,
      })
      .from(rotomDocuments)
      .where(eq(rotomDocuments.id, id))
      .limit(1);
    return result[0] || null;
  }

  async findUserDocuments(uuid: string): Promise<NotePreview[]> {
    return this.db
      .select({
        id: rotomDocuments.id,
        title: rotomDocuments.title,
        type: rotomDocuments.type,
        createdAt: rotomDocuments.createdAt,
        updatedAt: rotomDocuments.updatedAt,
      })
      .from(rotomDocuments)
      .innerJoin(
        rotomDocumentsUsers,
        eq(rotomDocuments.id, rotomDocumentsUsers.documentId),
      )
      .where(eq(rotomDocumentsUsers.uuid, uuid))
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
    documentData: {
      title?: string;
      content?: string;
      type?: number;
      public?: number;
    },
  ): Promise<void> {
    await this.db
      .update(rotomDocuments)
      .set({
        ...documentData,
        updatedAt: new Date(),
      } as RotomDocument)
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

  async addDocumentToUser(
    documentId: number,
    uuid: string,
  ): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocumentsUsers).values({
      documentId,
      uuid,
      createdAt: new Date(),
      updatedAt: new Date(),
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
