import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, desc, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { rotomNews, RotomNews } from '@/_db/schema/SmartRotomDocuments';
import { INewsRepository } from './interfaces/news.repository.interface';
import { NewsDetails } from './documents.repository';

@Injectable()
export class NewsRepository implements INewsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

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
