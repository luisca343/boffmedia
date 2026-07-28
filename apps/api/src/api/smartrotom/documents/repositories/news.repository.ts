import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc, inArray, isNotNull, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  rotomNews,
  RotomNews,
  rotomNewsComments,
  RotomNewsComment,
  rotomNewsletterSubscribers,
  RotomNewsletterSubscriber,
} from '@/_db/schema/SmartRotomDocuments';
import { rotomUsers } from '@/_db/schema/SmartRotom';
import {
  INewsRepository,
  NewsCommentRow,
  EditorialBoardRow,
  NewsIssueRow,
} from './interfaces/news.repository.interface';
import { NewsDetails } from './documents.repository';

const NEWS_COLUMNS = {
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
  updatedAt: rotomNews.updatedAt,
  author: rotomNews.author,
  authorRole: rotomNews.authorRole,
  issue: rotomNews.issue,
  claps: rotomNews.claps,
};

const NEWS_COMMENT_COLUMNS = {
  id: rotomNewsComments.id,
  newsId: rotomNewsComments.newsId,
  uuid: rotomNewsComments.uuid,
  username: rotomUsers.username,
  body: rotomNewsComments.body,
  createdAt: rotomNewsComments.createdAt,
};

@Injectable()
export class NewsRepository implements INewsRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  async findAllNews(): Promise<NewsDetails[]> {
    return this.db
      .select(NEWS_COLUMNS)
      .from(rotomNews)
      .orderBy(desc(rotomNews.id)) as unknown as NewsDetails[];
  }

  async findPublishedNews(): Promise<NewsDetails[]> {
    return this.db
      .select(NEWS_COLUMNS)
      .from(rotomNews)
      .where(eq(rotomNews.published, 1))
      .orderBy(desc(rotomNews.id)) as unknown as NewsDetails[];
  }

  async findNewsById(newsId: number): Promise<NewsDetails | null> {
    const result = await this.db
      .select(NEWS_COLUMNS)
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId))
      .limit(1);
    return (result[0] || null) as unknown as NewsDetails | null;
  }

  async findFeaturedNews(): Promise<NewsDetails | null> {
    const result = await this.db
      .select(NEWS_COLUMNS)
      .from(rotomNews)
      .where(eq(rotomNews.featured, 1))
      .limit(1);
    return (result[0] || null) as unknown as NewsDetails | null;
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
    author?: string;
    authorRole?: string;
    issue?: number;
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
      published?: number;
      featured?: number;
      content?: string;
      buttonText?: string;
      imageUrl?: string;
      author?: string;
      authorRole?: string;
      issue?: number;
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

  // ==================== COMMENTS ====================

  async findCommentsByNewsId(newsId: number): Promise<NewsCommentRow[]> {
    return this.db
      .select(NEWS_COMMENT_COLUMNS)
      .from(rotomNewsComments)
      .innerJoin(
        rotomUsers,
        eq(rotomNewsComments.uuid, rotomUsers.uuid),
      )
      .where(eq(rotomNewsComments.newsId, newsId))
      .orderBy(
        desc(rotomNewsComments.createdAt),
      ) as unknown as NewsCommentRow[];
  }

  async createComment(
    newsId: number,
    uuid: string,
    body: string,
  ): Promise<NewsCommentRow> {
    const result = await this.db.insert(rotomNewsComments).values({
      newsId,
      uuid,
      body,
      createdAt: new Date(),
    } as RotomNewsComment);
    const insertId = result[0].insertId;

    const [row] = await this.db
      .select(NEWS_COMMENT_COLUMNS)
      .from(rotomNewsComments)
      .innerJoin(
        rotomUsers,
        eq(rotomNewsComments.uuid, rotomUsers.uuid),
      )
      .where(eq(rotomNewsComments.id, insertId))
      .limit(1);

    return row as unknown as NewsCommentRow;
  }

  async deleteComment(commentId: number): Promise<void> {
    await this.db
      .delete(rotomNewsComments)
      .where(eq(rotomNewsComments.id, commentId));
  }

  // ==================== CLAPS ====================

  async incrementClaps(newsId: number): Promise<number> {
    await this.db
      .update(rotomNews)
      .set({
        claps: sql`${rotomNews.claps} + 1`,
      } as any)
      .where(eq(rotomNews.id, newsId));

    const [row] = await this.db
      .select({ claps: rotomNews.claps })
      .from(rotomNews)
      .where(eq(rotomNews.id, newsId))
      .limit(1);

    return row?.claps ?? 0;
  }

  // ==================== EDITORIAL BOARD ====================

  async findEditorialBoard(): Promise<EditorialBoardRow[]> {
    const result = await this.db
      .select({
        author: rotomNews.author,
        authorRole: rotomNews.authorRole,
        articles: sql<number>`COUNT(*)`.as('articles'),
      })
      .from(rotomNews)
      .where(and(eq(rotomNews.published, 1), isNotNull(rotomNews.author)))
      .groupBy(rotomNews.author, rotomNews.authorRole)
      .orderBy(desc(sql`COUNT(*)`));

    return result.map((row) => ({
      author: row.author as string,
      authorRole: row.authorRole,
      articles: Number(row.articles) || 0,
    }));
  }

  // ==================== ISSUES ====================

  async findIssues(): Promise<NewsIssueRow[]> {
    const counts = await this.db
      .select({
        issue: rotomNews.issue,
        articles: sql<number>`COUNT(*)`.as('articles'),
        publishedAt: sql<Date>`MAX(${rotomNews.createdAt})`.as('publishedAt'),
      })
      .from(rotomNews)
      .where(and(eq(rotomNews.published, 1), isNotNull(rotomNews.issue)))
      .groupBy(rotomNews.issue)
      .orderBy(desc(rotomNews.issue));

    const articles = await this.db
      .select({
        issue: rotomNews.issue,
        title: rotomNews.title,
        featured: rotomNews.featured,
        createdAt: rotomNews.createdAt,
      })
      .from(rotomNews)
      .where(and(eq(rotomNews.published, 1), isNotNull(rotomNews.issue)))
      .orderBy(desc(rotomNews.createdAt));

    // First pass per issue picks the newest article (rows arrive newest-first);
    // a featured article, if any, always wins over recency as the headline.
    const headlineByIssue = new Map<number, string>();
    for (const row of articles) {
      const issueNum = row.issue as number;
      if (!headlineByIssue.has(issueNum) || row.featured === 1) {
        headlineByIssue.set(issueNum, row.title);
      }
    }

    return counts.map((row) => ({
      issue: row.issue as number,
      articles: Number(row.articles) || 0,
      headline: headlineByIssue.get(row.issue as number) ?? '',
      publishedAt: row.publishedAt as Date,
    }));
  }

  // ==================== NEWSLETTER ====================

  async subscribeNewsletter(email: string): Promise<{ success: boolean }> {
    try {
      await this.db.insert(rotomNewsletterSubscribers).values({
        email,
        createdAt: new Date(),
      } as RotomNewsletterSubscriber);
    } catch (error: any) {
      // email is UNIQUE — a re-subscribe attempt is not an error from the
      // caller's perspective, so swallow the duplicate-key violation.
      if (error?.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
    return { success: true };
  }
}
