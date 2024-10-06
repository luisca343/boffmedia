import {
  RotomDocument,
  RotomNews,
  rotomDocuments,
  rotomDocumentsUsers,
  rotomNews,
} from '@/_db/schema/SmartRotomDocuments';
import { MySQL2Service } from '@/_utils/MySQL2Service';
import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
@Injectable()
export class DocumentsService {
  constructor(private db: MySQL2Service) {}

  async getNews() {
    const news = await this.db
      .getDrizzle()
      .select()
      .from(rotomNews)
      .orderBy(desc(rotomNews.id));

    const featured = news.find((item) => item.featured === 1);

    return { featured, news };
  }

  async updateNewsStatus(published: number[], featured: number) {
    await this.db
      .getDrizzle()
      .update(rotomNews)
      .set({ published: 0 } as RotomNews)
      .execute();

    await this.db
      .getDrizzle()
      .update(rotomNews)
      .set({ published: 1 } as RotomNews)
      .where(inArray(rotomNews.id, published))
      .execute();

    await this.db
      .getDrizzle()
      .update(rotomNews)
      .set({ featured: 0 } as RotomNews)
      .execute();

    await this.db
      .getDrizzle()
      .update(rotomNews)
      .set({ featured: 1 } as RotomNews)
      .where(eq(rotomNews.id, featured));

    return { success: true };
  }

  async getNewsById(newsId: number) {
    return (
      await this.db
        .getDrizzle()
        .select()
        .from(rotomNews)
        .where(eq(rotomNews.id, newsId))
    )[0];
  }

  async getNotes(uuid: string) {
    return await this.db
      .getDrizzle()
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
      .orderBy(desc(rotomDocuments.updatedAt));
  }

  async getDocument(id: number) {
    return (
      await this.db
        .getDrizzle()
        .select()
        .from(rotomDocuments)
        .where(eq(rotomDocuments.id, id))
    )[0];
  }

  async saveNote(
    id: number,
    title: string,
    content: string,
    documentType: number,
  ) {
    const exists = await this.db
      .getDrizzle()
      .select()
      .from(rotomDocuments)
      .where(eq(rotomDocuments.id, id));

    let result;
    if (exists.length === 0 || id === 0) {
      result = await this.db
        .getDrizzle()
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
        .getDrizzle()
        .update(rotomDocuments)
        .set({ title, content, type: documentType, updatedAt: new Date() })
        .where(eq(rotomDocuments.id, id))
        .execute();
    }

    return { success: true, id: result[0].insertId };
  }

  async saveNews(news: RotomNews, newsId: number) {
    const exists = await this.db
      .getDrizzle()
      .select()
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId));

    let result;

    if (exists.length === 0) {
      result = await this.db
        .getDrizzle()
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
      console.log(news);
      result = await this.db
        .getDrizzle()
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

      console.log(result);
    }

    return { success: true, id: result[0].insertId };
  }

  async addNoteToUser(documentId: number, uuid: string) {
    const exists = await this.db
      .getDrizzle()
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
        .getDrizzle()
        .insert(rotomDocumentsUsers)
        .values({ documentId, uuid })
        .execute();
    }
  }
}
