import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { TwitchApiService } from './twitch-api.service';

const mockConfigService = { get: jest.fn() };
const mockHttpService = {
  post: jest.fn(),
  get: jest.fn(),
};

const makeTokenResponse = () =>
  of({ data: { access_token: 'tok-abc', expires_in: 3600 } });

const makeStreamResponse = (streams: any[] = []) =>
  of({ data: { data: streams } });

const mockStream = {
  id: 's1',
  user_id: 'u1',
  user_login: 'luisca343',
  user_name: 'Luisca343',
  game_id: 'g1',
  game_name: 'Pixelmon',
  title: 'Shiny hunting!',
  viewer_count: 42,
  started_at: '2026-05-18T00:00:00Z',
  thumbnail_url: 'https://example.com/thumb.jpg',
  tags: [],
};

describe('TwitchApiService', () => {
  let service: TwitchApiService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) =>
      key === 'TWITCH_CLIENT_ID' ? 'client-id' : 'client-secret',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchApiService,
        Logger,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<TwitchApiService>(TwitchApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getStreamByUsername ──────────────────────────────────────────────────────

  describe('getStreamByUsername()', () => {
    it('returns the stream when user is live', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(makeStreamResponse([mockStream]));

      const result = await service.getStreamByUsername('luisca343');

      expect(result).toEqual(mockStream);
      expect(mockHttpService.get).toHaveBeenCalledWith(
        'https://api.twitch.tv/helix/streams',
        expect.objectContaining({ params: { user_login: 'luisca343' } }),
      );
    });

    it('returns null when user is offline', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(makeStreamResponse([]));

      const result = await service.getStreamByUsername('luisca343');

      expect(result).toBeNull();
    });

    it('rethrows on HTTP error', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('network')),
      );

      await expect(service.getStreamByUsername('luisca343')).rejects.toThrow('network');
    });
  });

  // ─── getStreamsByUsernames ────────────────────────────────────────────────────

  describe('getStreamsByUsernames()', () => {
    it('returns empty array for empty input', async () => {
      const result = await service.getStreamsByUsernames([]);
      expect(result).toEqual([]);
      expect(mockHttpService.get).not.toHaveBeenCalled();
    });

    it('aggregates streams across chunks', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(makeStreamResponse([mockStream]));

      const result = await service.getStreamsByUsernames(['luisca343']);

      expect(result).toHaveLength(1);
      expect(result[0].user_login).toBe('luisca343');
    });

    it('makes one call per 100-user chunk', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(makeStreamResponse([]));

      const users = Array.from({ length: 150 }, (_, i) => `user${i}`);
      await service.getStreamsByUsernames(users);

      expect(mockHttpService.get).toHaveBeenCalledTimes(2);
    });

    it('rethrows on API error', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(
        throwError(() => new Error('rate limited')),
      );

      await expect(service.getStreamsByUsernames(['luisca343'])).rejects.toThrow('rate limited');
    });
  });

  // ─── token caching ────────────────────────────────────────────────────────────

  describe('token caching', () => {
    it('reuses a valid cached token without re-requesting', async () => {
      mockHttpService.post.mockReturnValue(makeTokenResponse());
      mockHttpService.get.mockReturnValue(makeStreamResponse([]));

      await service.getStreamByUsername('user1');
      await service.getStreamByUsername('user2');

      expect(mockHttpService.post).toHaveBeenCalledTimes(1);
    });

    it('throws when credentials are not configured', async () => {
      mockConfigService.get.mockReturnValue(undefined);
      await expect(service.getStreamByUsername('luisca343')).rejects.toThrow(
        'Twitch credentials not configured',
      );
    });
  });
});
