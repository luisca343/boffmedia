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

  private readonly selectFields = {
    id: rotomNews.id,
    title: rotomNews.title,
    subtitle: rotomNews.subtitle,
    category: rotomNews.category,
    subcategory: rotomNews.subcategory,
    author: rotomNews.author,
    published: rotomNews.published,
    featured: rotomNews.featured,
    content: rotomNews.content,
    buttonText: rotomNews.buttonText,
    imageUrl: rotomNews.imageUrl,
    createdAt: rotomNews.createdAt,
    updatedAt: rotomNews.updatedAt,
  };

  private calculateReadTime(content: string): string {
    const text = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordCount = text.split(' ').filter(Boolean).length;
    const minutes = Math.max(1, Math.round(wordCount / 200));
    return `${minutes} min`;
  }

  private withReadTime<T extends { content: string }>(
    item: T,
  ): T & { readtime: string } {
    return { ...item, readtime: this.calculateReadTime(item.content) };
  }

  async findAllNews(): Promise<NewsDetails[]> {
    const rows = await this.db
      .select(this.selectFields)
      .from(rotomNews)
      .orderBy(desc(rotomNews.id));
    return rows.map((r) => this.withReadTime(r)) as unknown as NewsDetails[];
  }

  async findPublishedNews(): Promise<NewsDetails[]> {
    const rows = await this.db
      .select(this.selectFields)
      .from(rotomNews)
      .where(eq(rotomNews.published, 1))
      .orderBy(desc(rotomNews.id));
    return rows.map((r) => this.withReadTime(r)) as unknown as NewsDetails[];
  }

  async findNewsById(newsId: number): Promise<NewsDetails | null> {
    const result = await this.db
      .select(this.selectFields)
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId))
      .limit(1);
    return result[0]
      ? (this.withReadTime(result[0]) as unknown as NewsDetails)
      : null;
  }

  async findFeaturedNews(): Promise<NewsDetails | null> {
    const result = await this.db
      .select(this.selectFields)
      .from(rotomNews)
      .where(eq(rotomNews.featured, 1))
      .limit(1);
    return result[0]
      ? (this.withReadTime(result[0]) as unknown as NewsDetails)
      : null;
  }

  async createNews(newsData: {
    title: string;
    subtitle?: string;
    category?: string;
    subcategory?: string;
    author?: string;
    published?: number;
    featured?: number;
    content: string;
    buttonText?: string;
    imageUrl?: string;
  }): Promise<{ insertId: number }> {
    const result = await this.db.insert(rotomNews).values({
      ...newsData,
      published: newsData.published || 0,
      featured: newsData.featured || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as RotomNews);
    return { insertId: result[0].insertId };
  }

  async updateNews(
    newsId: number,
    newsData: {
      title?: string;
      subtitle?: string;
      category?: string;
      subcategory?: string;
      author?: string;
      published?: number;
      featured?: number;
      content?: string;
      buttonText?: string;
      imageUrl?: string;
    },
  ): Promise<void> {
    await this.db
      .update(rotomNews)
      .set({
        ...newsData,
        updatedAt: new Date(),
      } as RotomNews)
      .where(eq(rotomNews.id, newsId));
  }

  async deleteNews(newsId: number): Promise<void> {
    await this.db.delete(rotomNews).where(eq(rotomNews.id, newsId));
  }

  async updateAllNewsPublishedStatus(published: number): Promise<void> {
    await this.db.update(rotomNews).set({ published } as RotomNews);
  }

  async updateNewsPublishedStatus(
    newsIds: number[],
    published: number,
  ): Promise<void> {
    await this.db
      .update(rotomNews)
      .set({ published } as RotomNews)
      .where(inArray(rotomNews.id, newsIds));
  }

  async updateAllNewsFeaturedStatus(featured: number): Promise<void> {
    await this.db.update(rotomNews).set({ featured } as RotomNews);
  }

  async updateNewsFeaturedStatus(
    newsId: number,
    featured: number,
  ): Promise<void> {
    await this.db
      .update(rotomNews)
      .set({ featured } as RotomNews)
      .where(eq(rotomNews.id, newsId));
  }
}
