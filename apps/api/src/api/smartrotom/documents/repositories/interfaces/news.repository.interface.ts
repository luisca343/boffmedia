import { NewsDetails } from '../documents.repository';

export interface NewsCommentRow {
  id: number;
  newsId: number;
  uuid: string;
  username: string;
  body: string;
  createdAt: Date;
}

export interface EditorialBoardRow {
  author: string;
  authorRole: string | null;
  articles: number;
}

export interface NewsIssueRow {
  issue: number;
  articles: number;
  headline: string;
  publishedAt: Date;
}

export interface INewsRepository {
  findAllNews(): Promise<NewsDetails[]>;
  findPublishedNews(): Promise<NewsDetails[]>;
  findNewsById(newsId: number): Promise<NewsDetails | null>;
  findFeaturedNews(): Promise<NewsDetails | null>;
  createNews(newsData: {
    title: string;
    subtitle?: string;
    category?: string;
    subcategory?: string;
    published?: boolean;
    featured?: boolean;
    content: string;
    buttonText?: string;
    imageUrl?: string;
    author?: string;
    authorRole?: string;
    issue?: number;
  }): Promise<{ insertId: number }>;
  updateNews(
    newsId: number,
    newsData: {
      title?: string;
      subtitle?: string;
      category?: string;
      subcategory?: string;
      published?: boolean;
      featured?: boolean;
      content?: string;
      buttonText?: string;
      imageUrl?: string;
      author?: string;
      authorRole?: string;
      issue?: number;
    },
  ): Promise<void>;
  deleteNews(newsId: number): Promise<void>;
  updateAllNewsPublishedStatus(published: boolean): Promise<void>;
  updateNewsPublishedStatus(
    newsIds: number[],
    published: boolean,
  ): Promise<void>;
  updateAllNewsFeaturedStatus(featured: boolean): Promise<void>;
  updateNewsFeaturedStatus(newsId: number, featured: boolean): Promise<void>;

  findCommentsByNewsId(newsId: number): Promise<NewsCommentRow[]>;
  createComment(
    newsId: number,
    uuid: string,
    body: string,
  ): Promise<NewsCommentRow>;
  deleteComment(commentId: number): Promise<void>;

  incrementClaps(newsId: number): Promise<number>;

  findEditorialBoard(): Promise<EditorialBoardRow[]>;
  findIssues(): Promise<NewsIssueRow[]>;

  subscribeNewsletter(email: string): Promise<{ success: boolean }>;
}
