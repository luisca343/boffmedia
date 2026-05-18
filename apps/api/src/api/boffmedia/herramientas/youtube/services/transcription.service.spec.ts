import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { TranscriptionService } from './transcription.service';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

const mockVideoInfo = {
  basic_info: {
    title: 'Test Video',
    author: 'TestChannel',
    duration: 300,
    short_description: 'A test video',
    view_count: 1234,
    start_timestamp: '2026-01-01',
    thumbnail: [],
  },
  getTranscript: jest.fn(),
};

const mockYoutubeClient = {
  getInfo: jest.fn().mockResolvedValue(mockVideoInfo),
};

describe('TranscriptionService', () => {
  let service: TranscriptionService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockVideoInfo.getTranscript.mockReset();
    mockYoutubeClient.getInfo.mockResolvedValue(mockVideoInfo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<TranscriptionService>(TranscriptionService);

    jest
      .spyOn(service as any, 'getYoutubeClient')
      .mockResolvedValue(mockYoutubeClient);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTranscription ─────────────────────────────────────────────────────────

  describe('getTranscription()', () => {
    it('returns success with transcript segments', async () => {
      mockVideoInfo.getTranscript.mockResolvedValue({
        transcript: {
          content: {
            body: {
              initial_segments: [
                { snippet: { text: 'Hello' }, start_ms: '0', end_ms: '1000' },
                { snippet: { text: 'World' }, start_ms: '1000', end_ms: '2000' },
              ],
            },
          },
        },
      });

      const result = await service.getTranscription('dQw4w9WgXcQ');

      expect(result.success).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
      expect(result.title).toBe('Test Video');
      expect(result.transcript).toHaveLength(2);
      expect(result.transcript[0].text).toBe('Hello');
      expect(result.transcript[0].startTime).toBe('0:00');
    });

    it('returns success=false when transcript is unavailable', async () => {
      mockVideoInfo.getTranscript.mockResolvedValue(null);

      const result = await service.getTranscription('dQw4w9WgXcQ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not available');
    });

    it('accepts a full YouTube URL', async () => {
      mockVideoInfo.getTranscript.mockResolvedValue({
        transcript: { content: { body: { initial_segments: [] } } },
      });

      const result = await service.getTranscription(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      );

      expect(result.success).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('returns success=false for an invalid video ID', async () => {
      jest.spyOn(service as any, 'getYoutubeClient').mockResolvedValue(mockYoutubeClient);

      const result = await service.getTranscription('not-a-valid-id!!');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed');
    });

    it('returns success=false when youtube API throws', async () => {
      mockYoutubeClient.getInfo.mockRejectedValue(new Error('API error'));

      const result = await service.getTranscription('dQw4w9WgXcQ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('API error');
    });
  });

  // ─── getVideoInfo ─────────────────────────────────────────────────────────────

  describe('getVideoInfo()', () => {
    it('returns video metadata on success', async () => {
      const result = await service.getVideoInfo('dQw4w9WgXcQ');

      expect(result.success).toBe(true);
      expect(result.title).toBe('Test Video');
      expect(result.author).toBe('TestChannel');
      expect(result.duration).toBe(300);
    });

    it('accepts a youtu.be short URL', async () => {
      const result = await service.getVideoInfo('https://youtu.be/dQw4w9WgXcQ');

      expect(result.success).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('returns success=false when API throws', async () => {
      mockYoutubeClient.getInfo.mockRejectedValue(new Error('not found'));

      const result = await service.getVideoInfo('dQw4w9WgXcQ');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });
});
