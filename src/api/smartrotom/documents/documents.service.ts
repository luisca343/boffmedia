import { RotomDocument, RotomNews, rotomDocuments, rotomDocumentsUsers, rotomNews } from '@/_db/schema/SmartRotomDocuments';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { CreateNewsDto } from './dto/create-news-dto';
@Injectable()
export class DocumentsService {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async getNews(): Promise<{ featured: RotomNews; news: RotomNews[] }> {
    const news = await this.db
      
      .select()
      .from(rotomNews)
      .orderBy(desc(rotomNews.id));

    const featured = news.find((item) => item.featured === 1);

    return { featured, news };
  }

  async updateNewsStatus(published: number[], featured: number): Promise<{ success: boolean }> {
    await this.db
      .update(rotomNews)
      .set({ published: 0 } as RotomNews)
      .execute();

    await this.db
      .update(rotomNews)
      .set({ published: 1 } as RotomNews)
      .where(inArray(rotomNews.id, published))
      .execute();


    await this.db
      .update(rotomNews)
      .set({ featured: 0 } as RotomNews)
      .execute();

    await this.db
      .update(rotomNews)
      .set({ featured: 1 } as RotomNews)
      .where(eq(rotomNews.id, featured));
      
    return { success: true };
  }

  async getNewsById(newsId: number): Promise<RotomNews> {
    return (
      await this.db
        
        .select()
        .from(rotomNews)
        .where(eq(rotomNews.id, newsId))
    )[0];
  }

  async getNotes(uuid: string): Promise<Note[]> {
    return await this.db
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
      .orderBy(desc(rotomDocuments.updatedAt)) as unknown as Note[];
  }

  async getDocument(id: number): Promise<RotomDocument> {
    return (
      await this.db
        
        .select()
        .from(rotomDocuments)
        .where(eq(rotomDocuments.id, id))
    )[0];
  }

  async saveNote(id: number, title: string, content: string, documentType: number): Promise<{ success: boolean; id: number }> {



    const exists = await this.db
      .select()
      .from(rotomDocuments)
      .where(eq(rotomDocuments.id, id));

    let result;
    if (exists.length === 0 || id === 0) {
      result = await this.db
        .insert(rotomDocuments)
        .values({
          title,
          type: documentType,
          public: 0,
          content,
          id: id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as RotomDocument)
        .execute();
    } else {
      result = await this.db
        .update(rotomDocuments)
        .set({ title, content, type: documentType, updatedAt: new Date() })
        .where(eq(rotomDocuments.id, id))
        .execute();

    }

    return { success: true, id: result[0].insertId || exists[0].id };
  }

  async saveNews(news: CreateNewsDto, newsId: number): Promise<{ success: boolean; id: number }> {
    const exists = await this.db
      
      .select()
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId));

    let result;

    if (exists.length === 0) {
      result = await this.db
        .insert(rotomNews)
        .values({
          title: news.title,
          subtitle: news.subtitle,
          subcategory: news.subcategory,
          content: `<h1>${news.title}</h1>`,
          buttonText: news.buttonText,
          imageUrl: news.imageUrl,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as RotomNews)
        .execute();
    } else {
      result = await this.db
        
        .update(rotomNews)
        .set({
          title: news.title,
          subtitle: news.subtitle,
          subcategory: news.subcategory,
          content: news.content,
          buttonText: news.buttonText,
          imageUrl: news.imageUrl,
          updatedAt: new Date(),
        } as RotomNews)
        .where(eq(rotomNews.id, newsId))
        .execute();

      return { success: true, id: newsId };
    }

    return { success: true, id: result[0].insertId };
  }

  async addNoteToUser(documentId: number, uuid: string): Promise<{ success: boolean }> {
    const exists = await this.db
      
      .select()
      .from(rotomDocumentsUsers)
      .where(
        and(
          eq(rotomDocumentsUsers.documentId, documentId),
          eq(rotomDocumentsUsers.uuid, uuid),
        ),
      );

    if (exists.length === 0) {
      await this.db
        
        .insert(rotomDocumentsUsers)
        .values({ documentId, uuid })
        .execute();
    }

    return { success: true };
  }
}
