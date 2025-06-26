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

export interface DocumentDetails {
  id: number;
  title: string;
  content: string;
  type: number;
  //public: number;
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
export class DocumentsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== DOCUMENT OPERATIONS ====================

  async findDocumentById(id: number): Promise<DocumentDetails | null> {
    const result = await this.db.select({
      id: rotomDocuments.id,
      title: rotomDocuments.title,
      content: rotomDocuments.content,
      type: rotomDocuments.type,
      //public: rotomDocuments.public,
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

  async createDocument(documentData: {
    title: string;
    content: string;
    type: number;
    public?: number;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomDocuments)
      .values({
        ...documentData,
        public: documentData.public || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
    
    return { insertId: result[0].insertId };
  }

  async updateDocument(id: number, documentData: {
    title?: string;
    content?: string;
    type?: number;
    public?: number;
  }): Promise<void> {
    await this.db.update(rotomDocuments)
      .set({
        ...documentData,
        updatedAt: new Date()
      } as RotomDocument)
      .where(eq(rotomDocuments.id, id));
  }

  async deleteDocument(id: number): Promise<void> {
    await this.db.delete(rotomDocuments)
      .where(eq(rotomDocuments.id, id));
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
        uuid,
        createdAt: new Date(),
        updatedAt: new Date()
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

  async createNews(newsData: {
    title: string;
    subtitle?: string;
    category?: string;
    subcategory?: string;
    published?: number;
    featured?: number;
    content: string;
    buttonText?: string;
    imageUrl?: string;
  }): Promise<{ insertId: number }> {
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

  async updateNews(newsId: number, newsData: {
    title?: string;
    subtitle?: string;
    category?: string;
    subcategory?: string;
    published?: number;
    featured?: number;
    content?: string;
    buttonText?: string;
    imageUrl?: string;
  }): Promise<void> {
    await this.db.update(rotomNews)
      .set({
        ...newsData,
        updatedAt: new Date()
      } as RotomNews)
      .where(eq(rotomNews.id, newsId));
  }

  async deleteNews(newsId: number): Promise<void> {
    await this.db.delete(rotomNews)
      .where(eq(rotomNews.id, newsId));
  }

  async updateAllNewsPublishedStatus(published: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ published } as RotomNews);
  }

  async updateNewsPublishedStatus(newsIds: number[], published: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ published } as RotomNews)
      .where(inArray(rotomNews.id, newsIds));
  }

  async updateAllNewsFeaturedStatus(featured: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ featured } as RotomNews);
  }

  async updateNewsFeaturedStatus(newsId: number, featured: number): Promise<void> {
    await this.db.update(rotomNews)
      .set({ featured } as RotomNews)
      .where(eq(rotomNews.id, newsId));
  }
}