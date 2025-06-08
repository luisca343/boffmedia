import { Injectable } from '@nestjs/common';
import { DocumentsRepository, NewsDetails } from '@repositories/smartrotom/documents.repository';

export interface CreateNewsRequest {
  title: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface UpdateNewsRequest {
  title?: string;
  subtitle?: string;
  category?: string;
  subcategory?: string;
  published?: number;
  featured?: number;
  content?: string;
  buttonText?: string;
  imageUrl?: string;
}

export interface NewsResponse {
  featured: NewsDetails | null;
  news: NewsDetails[];
}

@Injectable()
export class NewsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  async getAllNews(): Promise<NewsResponse> {
    const allNews = await this.documentsRepository.findAllNews();
    const featured = allNews.find(item => item.featured === 1) || null;

    return { featured, news: allNews };
  }

  async getPublishedNews(): Promise<NewsResponse> {
    const publishedNews = await this.documentsRepository.findPublishedNews();
    const featured = publishedNews.find(item => item.featured === 1) || null;

    return { featured, news: publishedNews };
  }

  async getNewsById(newsId: number): Promise<NewsDetails> {
    if (!newsId || newsId <= 0) {
      throw new Error('Valid news ID is required');
    }

    const news = await this.documentsRepository.findNewsById(newsId);
    if (!news) {
      throw new Error('News not found');
    }

    return news;
  }

  async getFeaturedNews(): Promise<NewsDetails | null> {
    return this.documentsRepository.findFeaturedNews();
  }

  async createNews(createNewsRequest: CreateNewsRequest): Promise<NewsDetails> {
    const { title, content } = createNewsRequest;

    if (!title || !content) {
      throw new Error('Title and content are required');
    }

    // Validate URL if provided
    if (createNewsRequest.imageUrl && !this.isValidUrl(createNewsRequest.imageUrl)) {
      throw new Error('Invalid image URL format');
    }

    const result = await this.documentsRepository.createNews({
      ...createNewsRequest,
      title: title.trim(),
      content: content.trim()
    });

    return this.getNewsById(result.insertId);
  }

  async updateNews(newsId: number, updateNewsRequest: UpdateNewsRequest): Promise<NewsDetails> {
    const existingNews = await this.documentsRepository.findNewsById(newsId);
    if (!existingNews) {
      throw new Error('News not found');
    }

    // Validate URL if provided
    if (updateNewsRequest.imageUrl && !this.isValidUrl(updateNewsRequest.imageUrl)) {
      throw new Error('Invalid image URL format');
    }

    const updateData: any = {};
    
    Object.keys(updateNewsRequest).forEach(key => {
      const value = updateNewsRequest[key as keyof UpdateNewsRequest];
      if (value !== undefined) {
        if (typeof value === 'string') {
          updateData[key] = value.trim();
        } else {
          updateData[key] = value;
        }
      }
    });

    await this.documentsRepository.updateNews(newsId, updateData);
    return this.getNewsById(newsId);
  }

  async deleteNews(newsId: number): Promise<void> {
    const existingNews = await this.documentsRepository.findNewsById(newsId);
    if (!existingNews) {
      throw new Error('News not found');
    }

    await this.documentsRepository.deleteNews(newsId);
  }

  async updateNewsStatus(publishedIds: number[], featuredId: number): Promise<{ success: boolean }> {
    // Validate published IDs
    if (!Array.isArray(publishedIds)) {
      throw new Error('Published IDs must be an array');
    }

    if (!featuredId || featuredId <= 0) {
      throw new Error('Valid featured ID is required');
    }

    // Check if featured news exists
    const featuredNews = await this.documentsRepository.findNewsById(featuredId);
    if (!featuredNews) {
      throw new Error('Featured news not found');
    }

    // Validate all published news exist
    for (const id of publishedIds) {
      const news = await this.documentsRepository.findNewsById(id);
      if (!news) {
        throw new Error(`News with ID ${id} not found`);
      }
    }

    // Reset all news to unpublished and unfeatured
    await this.documentsRepository.updateAllNewsPublishedStatus(0);
    await this.documentsRepository.updateAllNewsFeaturedStatus(0);

    // Set published status for specified news
    if (publishedIds.length > 0) {
      await this.documentsRepository.updateNewsPublishedStatus(publishedIds, 1);
    }

    // Set featured status
    await this.documentsRepository.updateNewsFeaturedStatus(featuredId, 1);

    return { success: true };
  }

  async saveNews(news: CreateNewsRequest, newsId: number): Promise<{ success: boolean; id: number }> {
    // Legacy method for backward compatibility
    if (newsId === 0) {
      const newNews = await this.createNews(news);
      return { success: true, id: newNews.id };
    } else {
      const updatedNews = await this.updateNews(newsId, news);
      return { success: true, id: updatedNews.id };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}