import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';
import { NEWS_REPOSITORY_TOKEN } from '../repositories/interfaces/documents.repository.token';

const mockRepo = {
  findAllNews: jest.fn(),
  findPublishedNews: jest.fn(),
  findNewsById: jest.fn(),
  findFeaturedNews: jest.fn(),
  createNews: jest.fn(),
  updateNews: jest.fn(),
  deleteNews: jest.fn(),
  updateAllNewsPublishedStatus: jest.fn(),
  updateAllNewsFeaturedStatus: jest.fn(),
  updateNewsPublishedStatus: jest.fn(),
  updateNewsFeaturedStatus: jest.fn(),
};

const makeNews = (id: number, featured = 0) =>
  ({
    id,
    title: `News ${id}`,
    content: 'content',
    featured,
    published: true,
  }) as any;

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: NEWS_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getAllNews ────────────────────────────────────────────────────────────────

  describe('getAllNews()', () => {
    it('extracts featured item from all news', async () => {
      const news = [makeNews(1, 0), makeNews(2, 1)];
      mockRepo.findAllNews.mockResolvedValue(news);

      const result = await service.getAllNews();

      expect(result.featured!.id).toBe(2);
      expect(result.news).toHaveLength(2);
    });

    it('returns null featured when no item is featured', async () => {
      mockRepo.findAllNews.mockResolvedValue([makeNews(1, 0)]);

      const result = await service.getAllNews();

      expect(result.featured).toBeNull();
    });
  });

  // ─── getNewsById ──────────────────────────────────────────────────────────────

  describe('getNewsById()', () => {
    it('returns news item when found', async () => {
      const item = makeNews(1);
      mockRepo.findNewsById.mockResolvedValue(item);

      await expect(service.getNewsById(1)).resolves.toEqual(item);
    });

    it('throws when id is 0', async () => {
      await expect(service.getNewsById(0)).rejects.toThrow(
        'Valid news ID is required',
      );
    });

    it('throws when not found', async () => {
      mockRepo.findNewsById.mockResolvedValue(null);

      await expect(service.getNewsById(99)).rejects.toThrow('News not found');
    });
  });

  // ─── createNews ───────────────────────────────────────────────────────────────

  describe('createNews()', () => {
    it('creates news and returns it by insertId', async () => {
      const item = makeNews(1);
      mockRepo.createNews.mockResolvedValue({ insertId: 1 });
      mockRepo.findNewsById.mockResolvedValue(item);

      const result = await service.createNews({
        title: 'Breaking News',
        content: 'Body',
      });

      expect(result).toEqual(item);
    });

    it('throws when title is missing', async () => {
      await expect(
        service.createNews({ title: '', content: 'Body' }),
      ).rejects.toThrow('Title is required');
    });

    it('throws when imageUrl is invalid', async () => {
      await expect(
        service.createNews({ title: 'T', content: 'C', imageUrl: 'not-a-url' }),
      ).rejects.toThrow('Invalid image URL format');
    });

    it('accepts valid imageUrl', async () => {
      mockRepo.createNews.mockResolvedValue({ insertId: 1 });
      mockRepo.findNewsById.mockResolvedValue(makeNews(1));

      await expect(
        service.createNews({
          title: 'T',
          content: 'C',
          imageUrl: 'https://example.com/img.png',
        }),
      ).resolves.toBeDefined();
    });
  });

  // ─── updateNews ───────────────────────────────────────────────────────────────

  describe('updateNews()', () => {
    it('updates existing news', async () => {
      const item = makeNews(1);
      mockRepo.findNewsById.mockResolvedValue(item);
      mockRepo.updateNews.mockResolvedValue(undefined);
      mockRepo.findNewsById.mockResolvedValue({ ...item, title: 'Updated' });

      const result = await service.updateNews(1, { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockRepo.updateNews).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: 'Updated' }),
      );
    });

    it('creates news when not found (upsert)', async () => {
      mockRepo.findNewsById.mockResolvedValueOnce(null);
      const item = makeNews(5);
      mockRepo.createNews.mockResolvedValue({ insertId: 5 });
      mockRepo.findNewsById.mockResolvedValue(item);

      const result = await service.updateNews(99, {
        title: 'New Article',
        content: 'Body',
      });

      expect(result.id).toBe(5);
    });

    it('throws when imageUrl is invalid', async () => {
      mockRepo.findNewsById.mockResolvedValue(makeNews(1));

      await expect(
        service.updateNews(1, { imageUrl: 'bad-url' }),
      ).rejects.toThrow('Invalid image URL format');
    });
  });

  // ─── deleteNews ───────────────────────────────────────────────────────────────

  describe('deleteNews()', () => {
    it('deletes existing news', async () => {
      mockRepo.findNewsById.mockResolvedValue(makeNews(1));
      mockRepo.deleteNews.mockResolvedValue(undefined);

      await expect(service.deleteNews(1)).resolves.toBeUndefined();
      expect(mockRepo.deleteNews).toHaveBeenCalledWith(1);
    });

    it('throws when news not found', async () => {
      mockRepo.findNewsById.mockResolvedValue(null);

      await expect(service.deleteNews(99)).rejects.toThrow('News not found');
    });
  });

  // ─── updateNewsStatus ─────────────────────────────────────────────────────────

  describe('updateNewsStatus()', () => {
    it('resets all and sets published + featured', async () => {
      mockRepo.findNewsById.mockResolvedValue(makeNews(1)); // featured check
      mockRepo.findNewsById.mockResolvedValue(makeNews(2)); // published[0] check

      mockRepo.findNewsById.mockImplementation((id) =>
        Promise.resolve(makeNews(id)),
      );
      mockRepo.updateAllNewsPublishedStatus.mockResolvedValue(undefined);
      mockRepo.updateAllNewsFeaturedStatus.mockResolvedValue(undefined);
      mockRepo.updateNewsPublishedStatus.mockResolvedValue(undefined);
      mockRepo.updateNewsFeaturedStatus.mockResolvedValue(undefined);

      const result = await service.updateNewsStatus([2, 3], 1);

      expect(result.success).toBe(true);
      expect(mockRepo.updateAllNewsPublishedStatus).toHaveBeenCalledWith(false);
      expect(mockRepo.updateAllNewsFeaturedStatus).toHaveBeenCalledWith(false);
      expect(mockRepo.updateNewsPublishedStatus).toHaveBeenCalledWith(
        [2, 3],
        true,
      );
      expect(mockRepo.updateNewsFeaturedStatus).toHaveBeenCalledWith(1, true);
    });

    it('throws when publishedIds is not an array', async () => {
      await expect(service.updateNewsStatus('bad' as any, 1)).rejects.toThrow(
        'Published IDs must be an array',
      );
    });

    it('throws when featured news not found', async () => {
      mockRepo.findNewsById.mockResolvedValue(null);

      await expect(service.updateNewsStatus([], 99)).rejects.toThrow(
        'Featured news not found',
      );
    });
  });

  // ─── saveNews ─────────────────────────────────────────────────────────────────

  describe('saveNews()', () => {
    it('creates news when newsId is 0', async () => {
      mockRepo.createNews.mockResolvedValue({ insertId: 7 });
      mockRepo.findNewsById.mockResolvedValue(makeNews(7));

      const result = await service.saveNews({ title: 'T', content: 'C' }, 0);

      expect(result.success).toBe(true);
      expect(result.id).toBe(7);
    });

    it('updates news when newsId > 0', async () => {
      mockRepo.findNewsById.mockResolvedValue(makeNews(3));
      mockRepo.updateNews.mockResolvedValue(undefined);
      mockRepo.findNewsById.mockResolvedValue(makeNews(3));

      const result = await service.saveNews(
        { title: 'Updated', content: 'C' },
        3,
      );

      expect(result.success).toBe(true);
      expect(result.id).toBe(3);
    });
  });
});
