import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { YoutubeFacadeService } from './youtube.facade.service';
import { TranscriptionService } from './services/transcription.service';

const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
const mockTranscriptionService = {
  getTranscription: jest.fn(),
  getVideoInfo: jest.fn(),
};

describe('YoutubeFacadeService', () => {
  let service: YoutubeFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YoutubeFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: TranscriptionService, useValue: mockTranscriptionService },
      ],
    }).compile();

    service = module.get<YoutubeFacadeService>(YoutubeFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTranscription ─────────────────────────────────────────────────────────

  describe('getTranscription()', () => {
    it('delegates to TranscriptionService and returns the result', async () => {
      const transcription = { success: true, videoId: 'abc', transcript: [] };
      mockTranscriptionService.getTranscription.mockResolvedValue(
        transcription,
      );

      const result = await service.getTranscription('abc');

      expect(mockTranscriptionService.getTranscription).toHaveBeenCalledWith(
        'abc',
      );
      expect(result).toEqual(transcription);
    });

    it('wraps errors and rethrows', async () => {
      mockTranscriptionService.getTranscription.mockRejectedValue(
        new Error('unavailable'),
      );

      await expect(service.getTranscription('abc')).rejects.toThrow(
        'Failed to retrieve transcription',
      );
    });
  });

  // ─── getVideoInfo ─────────────────────────────────────────────────────────────

  describe('getVideoInfo()', () => {
    it('delegates to TranscriptionService and returns the result', async () => {
      const videoInfo = { success: true, videoId: 'abc', title: 'Test Video' };
      mockTranscriptionService.getVideoInfo.mockResolvedValue(videoInfo);

      const result = await service.getVideoInfo('abc');

      expect(mockTranscriptionService.getVideoInfo).toHaveBeenCalledWith('abc');
      expect(result).toEqual(videoInfo);
    });

    it('wraps errors and rethrows', async () => {
      mockTranscriptionService.getVideoInfo.mockRejectedValue(
        new Error('not found'),
      );

      await expect(service.getVideoInfo('abc')).rejects.toThrow(
        'Failed to retrieve video info',
      );
    });
  });
});
