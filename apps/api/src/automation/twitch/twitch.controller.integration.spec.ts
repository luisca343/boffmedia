import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { TwitchController } from './twitch.controller';
import { TwitchMonitorService } from './services/twitch-monitor.service';
import { TwitchApiService } from './services/twitch-api.service';
import { NotificationService } from './services/notification.service';
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter';
import { Logger } from 'nestjs-pino';

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() };

const mockMonitor = {
  getMonitoringStatus: jest.fn(),
  checkStreamsNow: jest.fn(),
  addMonitoredUser: jest.fn(),
  removeMonitoredUser: jest.fn(),
};

const mockTwitchApi = {
  getStreamByUsername: jest.fn(),
};

const mockNotification = {
  getTargets: jest.fn(),
  addTarget: jest.fn(),
  removeTarget: jest.fn(),
};

describe('TwitchController — integration (ValidationPipe + GlobalExceptionFilter)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [TwitchController],
      providers: [
        { provide: Logger, useValue: mockLogger },
        { provide: TwitchMonitorService, useValue: mockMonitor },
        { provide: TwitchApiService, useValue: mockTwitchApi },
        { provide: NotificationService, useValue: mockNotification },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter(mockLogger as any));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ── GET /automation/twitch/status ─────────────────────────────────────────

  describe('GET /automation/twitch/status', () => {
    it('returns monitoring status', async () => {
      mockMonitor.getMonitoringStatus.mockReturnValue({ active: true });
      mockNotification.getTargets.mockReturnValue([{ type: 'discord' }]);

      const res = await request(app.getHttpServer())
        .get('/automation/twitch/status');

      expect(res.status).toBeLessThan(300);
      expect(res.body).toMatchObject({ status: 'active' });
      expect(res.body.targets).toEqual([{ type: 'discord', configured: true }]);
    });
  });

  // ── POST /automation/twitch/check-now ─────────────────────────────────────

  describe('POST /automation/twitch/check-now', () => {
    it('triggers manual check and returns result', async () => {
      mockMonitor.checkStreamsNow.mockResolvedValue({ checked: 3 });
      const res = await request(app.getHttpServer())
        .post('/automation/twitch/check-now');

      expect(res.status).toBeLessThan(300);
      expect(res.body).toMatchObject({ message: 'Manual stream check completed', checked: 3 });
    });
  });

  // ── GET /automation/twitch/streams/user/:username ──────────────────────────

  describe('GET /automation/twitch/streams/user/:username', () => {
    it('returns stream info for a live user', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue({
        title: 'Wingull stream',
        tags: [],
        game_name: 'Minecraft',
      });

      const res = await request(app.getHttpServer())
        .get('/automation/twitch/streams/user/testuser');

      expect(res.status).toBeLessThan(300);
      expect(res.body).toMatchObject({ username: 'testuser', isLive: true });
      expect(mockTwitchApi.getStreamByUsername).toHaveBeenCalledWith('testuser');
    });

    it('returns isLive false when stream is null', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/automation/twitch/streams/user/offlineuser');

      expect(res.status).toBeLessThan(300);
      expect(res.body).toMatchObject({ isLive: false, containsWingull: false });
    });

    it('detects wingull in title', async () => {
      mockTwitchApi.getStreamByUsername.mockResolvedValue({
        title: 'Playing wingull today',
        tags: [],
        game_name: 'Minecraft',
      });

      const res = await request(app.getHttpServer())
        .get('/automation/twitch/streams/user/streamer');

      expect(res.status).toBeLessThan(300);
      expect(res.body.containsWingull).toBe(true);
    });
  });

  // ── POST /automation/twitch/monitor/user/:username ────────────────────────

  describe('POST /automation/twitch/monitor/user/:username', () => {
    it('adds user to monitoring', async () => {
      mockMonitor.addMonitoredUser.mockReturnValue(undefined);
      mockMonitor.getMonitoringStatus.mockReturnValue({ users: ['newuser'] });

      const res = await request(app.getHttpServer())
        .post('/automation/twitch/monitor/user/newuser');

      expect(res.status).toBeLessThan(300);
      expect(mockMonitor.addMonitoredUser).toHaveBeenCalledWith('newuser');
      expect(res.body.message).toContain('newuser');
    });
  });

  // ── DELETE /automation/twitch/monitor/user/:username ──────────────────────

  describe('DELETE /automation/twitch/monitor/user/:username', () => {
    it('removes user from monitoring', async () => {
      mockMonitor.removeMonitoredUser.mockReturnValue(undefined);
      mockMonitor.getMonitoringStatus.mockReturnValue({ users: [] });

      const res = await request(app.getHttpServer())
        .delete('/automation/twitch/monitor/user/olduser');

      expect(res.status).toBeLessThan(300);
      expect(mockMonitor.removeMonitoredUser).toHaveBeenCalledWith('olduser');
      expect(res.body.message).toContain('olduser');
    });
  });

  // ── POST /automation/twitch/notifications/target ──────────────────────────

  describe('POST /automation/twitch/notifications/target', () => {
    it('adds a valid notification target', async () => {
      mockNotification.addTarget.mockReturnValue(undefined);
      mockNotification.getTargets.mockReturnValue([{ type: 'discord' }]);

      const res = await request(app.getHttpServer())
        .post('/automation/twitch/notifications/target')
        .send({ type: 'discord', config: { channelId: '12345', botToken: 'token' } });

      expect(res.status).toBeLessThan(300);
      expect(mockNotification.addTarget).toHaveBeenCalled();
      expect(res.body.targets).toBe(1);
    });

    it('rejects invalid target type', async () => {
      await request(app.getHttpServer())
        .post('/automation/twitch/notifications/target')
        .send({ type: 'invalid', config: {} })
        .expect(400);
    });
  });

  // ── DELETE /automation/twitch/notifications/target/:type ──────────────────

  describe('DELETE /automation/twitch/notifications/target/:type', () => {
    it('removes a notification target', async () => {
      mockNotification.removeTarget.mockReturnValue(undefined);
      mockNotification.getTargets.mockReturnValue([]);

      const res = await request(app.getHttpServer())
        .delete('/automation/twitch/notifications/target/discord');

      expect(res.status).toBeLessThan(300);
      expect(mockNotification.removeTarget).toHaveBeenCalledWith('discord');
      expect(res.body.targets).toBe(0);
    });
  });
});
