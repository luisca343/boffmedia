import { Injectable } from '@nestjs/common';
import { DocumentsRepository } from '@api/_repositories/smartrotom/documents.repository';
import {
  CreateNewsRequest,
  UpdateNewsRequest,
  NewsResponse,
  GetAllNewsResponse,
  GetPublishedNewsResponse,
  NewsCreationData,
  NewsUpdateData,
  UpdateNewsStatusRequest
} from '@api/smartrotom/documents/types/documents.types';

@Injectable()
export class NewsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async getAllNews(): Promise<GetAllNewsResponse> {
    const allNews = await this.documentsRepository.findAllNews();
    const featured = await this.documentsRepository.findFeaturedNews();

    const newsResponses: NewsResponse[] = allNews.map(news => ({
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      subcategory: news.subcategory,
      published: news.published,
      featured: news.featured,
      content: news.content,
      buttonText: news.buttonText,
      imageUrl: news.imageUrl,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt
    }));

    const featuredResponse: NewsResponse | null = featured ? {
      id: featured.id,
      title: featured.title,
      subtitle: featured.subtitle,
      category: featured.category,
      subcategory: featured.subcategory,
      published: featured.published,
      featured: featured.featured,
      content: featured.content,
      buttonText: featured.buttonText,
      imageUrl: featured.imageUrl,
      createdAt: featured.createdAt,
      updatedAt: featured.updatedAt
    } : null;

    return {
      featured: featuredResponse,
      news: newsResponses
    };
  }

  async getPublishedNews(): Promise<GetPublishedNewsResponse> {
    const publishedNews = await this.documentsRepository.findPublishedNews();
    const featured = await this.documentsRepository.findFeaturedNews();

    const newsResponses: NewsResponse[] = publishedNews.map(news => ({
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      subcategory: news.subcategory,
      published: news.published,
      featured: news.featured,
      content: news.content,
      buttonText: news.buttonText,
      imageUrl: news.imageUrl,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt
    }));

    const featuredResponse: NewsResponse | null = featured && featured.published === 1 ? {
      id: featured.id,
      title: featured.title,
      subtitle: featured.subtitle,
      category: featured.category,
      subcategory: featured.subcategory,
      published: featured.published,
      featured: featured.featured,
      content: featured.content,
      buttonText: featured.buttonText,
      imageUrl: featured.imageUrl,
      createdAt: featured.createdAt,
      updatedAt: featured.updatedAt
    } : null;

    return {
      featured: featuredResponse,
      news: newsResponses
    };
  }

  async getNewsById(newsId: number): Promise<NewsResponse | null> {
    const news = await this.documentsRepository.findNewsById(newsId);
    if (!news) {
      return null;
    }

    return {
      id: news.id,
      title: news.title,
      subtitle: news.subtitle,
      category: news.category,
      subcategory: news.subcategory,
      published: news.published,
      featured: news.featured,
      content: news.content,
      buttonText: news.buttonText,
      imageUrl: news.imageUrl,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt
    };
  }

  async getFeaturedNews(): Promise<NewsResponse | null> {
    const featured = await this.documentsRepository.findFeaturedNews();
    if (!featured) {
      return null;
    }

    return {
      id: featured.id,
      title: featured.title,
      subtitle: featured.subtitle,
      category: featured.category,
      subcategory: featured.subcategory,
      published: featured.published,
      featured: featured.featured,
      content: featured.content,
      buttonText: featured.buttonText,
      imageUrl: featured.imageUrl,
      createdAt: featured.createdAt,
      updatedAt: featured.updatedAt
    };
  }

  async createNews(createNewsRequest: CreateNewsRequest): Promise<NewsResponse> {
    const newsData: NewsCreationData = {
      title: createNewsRequest.title,
      subtitle: createNewsRequest.subtitle || '',
      category: createNewsRequest.category || '',
      subcategory: createNewsRequest.subcategory || '',
      published: createNewsRequest.published || 0,
      featured: createNewsRequest.featured || 0,
      content: createNewsRequest.content,
      buttonText: createNewsRequest.buttonText || '',
      imageUrl: createNewsRequest.imageUrl || ''
    };

    const result = await this.documentsRepository.createNews(newsData);
    const createdNews = await this.getNewsById(result.insertId);

    if (!createdNews) {
      throw new Error('Failed to retrieve created news');
    }

    return createdNews;
  }

  async updateNews(newsId: number, updateNewsRequest: UpdateNewsRequest): Promise<NewsResponse> {
    const newsExists = await this.documentsRepository.newsExists(newsId);
    if (!newsExists) {
      throw new Error('News not found');
    }

    const updateData: NewsUpdateData = {
      title: updateNewsRequest.title,
      subtitle: updateNewsRequest.subtitle,
      category: updateNewsRequest.category,
      subcategory: updateNewsRequest.subcategory,
      published: updateNewsRequest.published,
      featured: updateNewsRequest.featured,
      content: updateNewsRequest.content,
      buttonText: updateNewsRequest.buttonText,
      imageUrl: updateNewsRequest.imageUrl
    };

    await this.documentsRepository.updateNews(newsId, updateData);
    
    const updatedNews = await this.getNewsById(newsId);
    if (!updatedNews) {
      throw new Error('Failed to retrieve updated news');
    }

    return updatedNews;
  }

  async deleteNews(newsId: number): Promise<void> {
    const newsExists = await this.documentsRepository.newsExists(newsId);
    if (!newsExists) {
      throw new Error('News not found');
    }

    await this.documentsRepository.deleteNews(newsId);
  }

  async updateNewsStatus(updateStatusRequest: UpdateNewsStatusRequest): Promise<{ success: boolean }> {
    try {
      // First, set all news as unpublished and unfeatured
      await this.documentsRepository.updateAllNewsPublishedStatus(0);
      await this.documentsRepository.updateAllNewsFeaturedStatus(0);

      // Set specified news as published
      if (updateStatusRequest.publishedIds.length > 0) {
        await this.documentsRepository.updateNewsPublishedStatus(updateStatusRequest.publishedIds, 1);
      }

      // Set featured news
      if (updateStatusRequest.featuredId) {
        await this.documentsRepository.updateNewsFeaturedStatus(updateStatusRequest.featuredId, 1);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating news status:', error);
      throw new Error(`Failed to update news status: ${error.message}`);
    }
  }

  async saveNews(newsData: CreateNewsRequest, newsId?: number): Promise<{ success: boolean; id: number }> {
    try {
      if (newsId) {
        // Update existing news
        const newsExists = await this.documentsRepository.newsExists(newsId);
        if (!newsExists) {
          throw new Error('News not found');
        }

        await this.documentsRepository.updateNews(newsId, newsData);
        return { success: true, id: newsId };
      } else {
        // Create new news
        const result = await this.documentsRepository.createNews(newsData);
        return { success: true, id: result.insertId };
      }
    } catch (error) {
      console.error('Error saving news:', error);
      throw new Error(`Failed to save news: ${error.message}`);
    }
  }

  async validateNewsExists(newsId: number): Promise<boolean> {
    return this.documentsRepository.newsExists(newsId);
  }
}