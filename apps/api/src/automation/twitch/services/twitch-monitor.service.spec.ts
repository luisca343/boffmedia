import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { TwitchMonitorService } from './twitch-monitor.service';
import { TwitchApiService } from './twitch-api.service';
import { NotificationService } from './notification.service';

const mockTwitchApiService = {
  getStreamsByUsernames: jest.fn(),
};

const mockNotificationService = {
  sendStreamNotification: jest.fn(),
};

const makeStream = (overrides: Partial<any> = {}) => ({
  id: 's1',
  user_id: 'u1',
  user_login: 'luisca343',
  user_name: 'Luisca343',
  game_name: 'Minecraft',
  title: 'Playing Pixelmon wingull server!',
  viewer_count: 42,
  started_at: '2026-05-18T00:00:00Z',
  thumbnail_url: '',
  tags: [],
  ...overrides,
});

describe('TwitchMonitorService', () => {
  let service: TwitchMonitorService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockNotificationService.sendStreamNotification.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwitchMonitorService,
        Logger,
        { provide: TwitchApiService, useValue: mockTwitchApiService },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<TwitchMonitorService>(TwitchMonitorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── addMonitoredUser / removeMonitoredUser ───────────────────────────────────

  describe('addMonitoredUser()', () => {
    it('adds a user (lowercased) to the monitoring list', () => {
      service.addMonitoredUser('Luisca343');
      const status = service.getMonitoringStatus();
      expect(status.monitoredUsers).toContain('luisca343');
    });

    it('does not add the same user twice', () => {
      service.addMonitoredUser('luisca343');
      service.addMonitoredUser('LUISCA343');
      expect(service.getMonitoringStatus().monitoredUsers).toHaveLength(1);
    });
  });

  describe('removeMonitoredUser()', () => {
    it('removes a user by username', () => {
      service.addMonitoredUser('luisca343');
      service.removeMonitoredUser('luisca343');
      expect(service.getMonitoringStatus().monitoredUsers).toHaveLength(0);
    });

    it('does nothing when user is not in list', () => {
      service.addMonitoredUser('luisca343');
      service.removeMonitoredUser('unknown');
      expect(service.getMonitoringStatus().monitoredUsers).toHaveLength(1);
    });
  });

  // ─── getMonitoringStatus ──────────────────────────────────────────────────────

  describe('getMonitoringStatus()', () => {
    it('returns zero counts when nothing is tracked', () => {
      const status = service.getMonitoringStatus();
      expect(status.cachedStreams).toBe(0);
      expect(status.liveStreams).toBe(0);
    });
  });

  // ─── checkStreamsNow ──────────────────────────────────────────────────────────

  describe('checkStreamsNow()', () => {
    it('returns zero counts when no users are monitored', async () => {
      const result = await service.checkStreamsNow();
      expect(result.foundStreams).toBe(0);
      expect(result.notifications).toBe(0);
      expect(mockTwitchApiService.getStreamsByUsernames).not.toHaveBeenCalled();
    });

    it('sends a notification for new wingull stream (title match)', async () => {
      service.addMonitoredUser('luisca343');
      mockTwitchApiService.getStreamsByUsernames.mockResolvedValue([
        makeStream({ title: 'Playing wingull server!' }),
      ]);

      const result = await service.checkStreamsNow();

      expect(result.foundStreams).toBe(1);
      expect(result.notifications).toBe(1);
      expect(mockNotificationService.sendStreamNotification).toHaveBeenCalledTimes(1);
    });

    it('sends a notification for wingull game category', async () => {
      service.addMonitoredUser('luisca343');
      mockTwitchApiService.getStreamsByUsernames.mockResolvedValue([
        makeStream({ title: 'Just streaming', game_name: 'Pixelmon Wingull 2' }),
      ]);

      const result = await service.checkStreamsNow();

      expect(result.notifications).toBe(1);
    });

    it('sends a notification when wingull tag is present', async () => {
      service.addMonitoredUser('luisca343');
      mockTwitchApiService.getStreamsByUsernames.mockResolvedValue([
        makeStream({ title: 'Streaming', tags: ['wingull', 'pixelmon'] }),
      ]);

      const result = await service.checkStreamsNow();

      expect(result.notifications).toBe(1);
    });

    it('does not notify for non-wingull streams', async () => {
      service.addMonitoredUser('luisca343');
      mockTwitchApiService.getStreamsByUsernames.mockResolvedValue([
        makeStream({ title: 'Playing Minecraft', game_name: 'Minecraft', tags: [] }),
      ]);

      const result = await service.checkStreamsNow();

      expect(result.foundStreams).toBe(1);
      expect(result.notifications).toBe(0);
    });

    it('does not send a second notification for the same ongoing stream', async () => {
      service.addMonitoredUser('luisca343');
      const stream = makeStream({ title: 'wingull stream', id: 's1', user_id: 'u1' });
      mockTwitchApiService.getStreamsByUsernames.mockResolvedValue([stream]);

      await service.checkStreamsNow();
      await service.checkStreamsNow();

      expect(mockNotificationService.sendStreamNotification).toHaveBeenCalledTimes(1);
    });

    it('returns zero counts when the API service throws (error is swallowed)', async () => {
      service.addMonitoredUser('luisca343');
      mockTwitchApiService.getStreamsByUsernames.mockRejectedValue(new Error('network'));

      const result = await service.checkStreamsNow();
      expect(result.foundStreams).toBe(0);
      expect(result.notifications).toBe(0);
    });
  });
});
