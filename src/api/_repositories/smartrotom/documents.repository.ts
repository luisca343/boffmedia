import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  rotomDocuments, 
  rotomDocumentsUsers, 
  rotomNews,
  RotomDocument,
  RotomNews,
  RotomDocumentUser
} from '@/_db/schema/SmartRotomDocuments';
import {
  DocumentDetails,
  NewsDetails,
  NotePreview,
  DocumentCreationData,
  DocumentUpdateData,
  NewsCreationData,
  NewsUpdateData
} from '@api/smartrotom/documents/types/documents.types';

@Injectable()
export class DocumentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== DOCUMENT OPERATIONS ====================

  async findDocumentById(id: number): Promise<Partial<DocumentDetails> | null> {
    const result = await this.db.select({
      id: rotomDocuments.id,
      title: rotomDocuments.title,
      content: rotomDocuments.content,
      type: rotomDocuments.type,
      createdAt: rotomDocuments.createdAt,
      updatedAt: rotomDocuments.updatedAt
    })
    .from(rotomDocuments)
    .where(eq(rotomDocuments.id, id))
    .limit(1);

    return result[0] || null;
  }

  async findUserDocuments(uuid: string): Promise<NotePreview[]> {
    return this.db.select({
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

  async createDocument(documentData: DocumentCreationData): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocuments)
      .values({
        title: documentData.title,
        content: documentData.content,
        type: documentData.type,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RotomDocument);
    
    return { insertId: result[0].insertId };
  }

  async updateDocument(id: number, documentData: DocumentUpdateData): Promise<void> {
    await this.db.update(rotomDocuments)
      .set({
        ...documentData,
        updatedAt: new Date()
      } as Partial<RotomDocument>)
      .where(eq(rotomDocuments.id, id));
  }

  async deleteDocument(id: number): Promise<void> {
    await this.db.delete(rotomDocuments)
      .where(eq(rotomDocuments.id, id));
  }

  async documentExists(id: number): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomDocuments)
      .where(eq(rotomDocuments.id, id))
      .limit(1);

    return result.length > 0;
  }

  // ==================== DOCUMENT-USER ASSOCIATION OPERATIONS ====================

  async findDocumentUserAssociation(documentId: number, uuid: string): Promise<RotomDocumentUser | null> {
    const result = await this.db.select()
      .from(rotomDocumentsUsers)
      .where(and(
        eq(rotomDocumentsUsers.documentId, documentId),
        eq(rotomDocumentsUsers.uuid, uuid)
      ))
      .limit(1);

    return result[0] || null;
  }

  async addDocumentToUser(documentId: number, uuid: string): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocumentsUsers)
      .values({
        documentId,
        uuid
      } as RotomDocumentUser);
    
    return { insertId: result[0].insertId };
  }

  async removeDocumentFromUser(documentId: number, uuid: string): Promise<void> {
    await this.db.delete(rotomDocumentsUsers)
      .where(and(
        eq(rotomDocumentsUsers.documentId, documentId),
        eq(rotomDocumentsUsers.uuid, uuid)
      ));
  }

  // ==================== NEWS OPERATIONS ====================

  async findAllNews(): Promise<NewsDetails[]> {
    return this.db.select({
      id: rotomNews.id,
      title: rotomNews.title,
      subtitle: rotomNews.subtitle,
      category: rotomNews.category,
      subcategory: rotomNews.subcategory,
      published: rotomNews.published,
      featured: rotomNews.featured,
      content: rotomNews.content,
      buttonText: rotomNews.buttonText,
      imageUrl: rotomNews.imageUrl,
      createdAt: rotomNews.createdAt,
      updatedAt: rotomNews.updatedAt
    })
    .from(rotomNews)
    .orderBy(desc(rotomNews.id));
  }

  async findPublishedNews(): Promise<NewsDetails[]> {
    return this.db.select({
      id: rotomNews.id,
      title: rotomNews.title,
      subtitle: rotomNews.subtitle,
      category: rotomNews.category,
      subcategory: rotomNews.subcategory,
      published: rotomNews.published,
      featured: rotomNews.featured,
      content: rotomNews.content,
      buttonText: rotomNews.buttonText,
      imageUrl: rotomNews.imageUrl,
      createdAt: rotomNews.createdAt,
      updatedAt: rotomNews.updatedAt
    })
    .from(rotomNews)
    .where(eq(rotomNews.published, 1))
    .orderBy(desc(rotomNews.id));
  }

  async findNewsById(newsId: number): Promise<NewsDetails | null> {
    const result = await this.db.select({
      id: rotomNews.id,
      title: rotomNews.title,
      subtitle: rotomNews.subtitle,
      category: rotomNews.category,
      subcategory: rotomNews.subcategory,
      published: rotomNews.published,
      featured: rotomNews.featured,
      content: rotomNews.content,
      buttonText: rotomNews.buttonText,
      imageUrl: rotomNews.imageUrl,
      createdAt: rotomNews.createdAt,
      updatedAt: rotomNews.updatedAt
    })
    .from(rotomNews)
    .where(eq(rotomNews.id, newsId))
    .limit(1);

    return result[0] || null;
  }

  async findFeaturedNews(): Promise<NewsDetails | null> {
    const result = await this.db.select({
      id: rotomNews.id,
      title: rotomNews.title,
      subtitle: rotomNews.subtitle,
      category: rotomNews.category,
      subcategory: rotomNews.subcategory,
      published: rotomNews.published,
      featured: rotomNews.featured,
      content: rotomNews.content,
      buttonText: rotomNews.buttonText,
      imageUrl: rotomNews.imageUrl,
      createdAt: rotomNews.createdAt,
      updatedAt: rotomNews.updatedAt
    })
    .from(rotomNews)
    .where(eq(rotomNews.featured, 1))
    .limit(1);

    return result[0] || null;
  }

  async createNews(newsData: NewsCreationData): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomNews)
      .values({
        ...newsData,
        published: newsData.published || 0,
        featured: newsData.featured || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RotomNews);
    
    return { insertId: result[0].insertId };
  }

  async updateNews(newsId: number, newsData: NewsUpdateData): Promise<void> {
    await this.db.update(rotomNews)
      .set({
        ...newsData,
        updatedAt: new Date()
      } as Partial<RotomNews>)
      .where(eq(rotomNews.id, newsId));
  }

  async deleteNews(newsId: number): Promise<void> {
    await this.db.delete(rotomNews)
      .where(eq(rotomNews.id, newsId));
  }

  async updateAllNewsPublishedStatus(published: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ published } as Partial<RotomNews>);
  }

  async updateNewsPublishedStatus(newsIds: number[], published: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ published } as Partial<RotomNews>)
      .where(inArray(rotomNews.id, newsIds));
  }

  async updateAllNewsFeaturedStatus(featured: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ featured } as Partial<RotomNews>);
  }

  async updateNewsFeaturedStatus(newsId: number, featured: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ featured } as Partial<RotomNews>)
      .where(eq(rotomNews.id, newsId));
  }

  async newsExists(newsId: number): Promise<boolean> {
    const result = await this.db.select()
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId))
      .limit(1);

    return result.length > 0;
  }
}