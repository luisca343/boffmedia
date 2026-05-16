import { NewsDetails } from '../documents.repository';

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
    published?: number;
    featured?: number;
    content: string;
    buttonText?: string;
    imageUrl?: string;
  }): Promise<{ insertId: number }>;
  updateNews(
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
    },
  ): Promise<void>;
  deleteNews(newsId: number): Promise<void>;
  updateAllNewsPublishedStatus(published: number): Promise<void>;
  updateNewsPublishedStatus(
    newsIds: number[],
    published: number,
  ): Promise<void>;
  updateAllNewsFeaturedStatus(featured: number): Promise<void>;
  updateNewsFeaturedStatus(newsId: number, featured: number): Promise<void>;
}
