import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { NotificationService } from './notification.service';

const mockConfigService = { get: jest.fn().mockReturnValue(undefined) };
const mockHttpService = { post: jest.fn() };

const makeNotification = () => ({
  stream: {
    id: 'stream-1',
    user_name: 'Luisca343',
    game_name: 'Pokémon',
    title: 'Shiny hunting!',
    viewer_count: 42,
    started_at: '2026-05-18T00:00:00Z',
    thumbnail_url: '',
    tags: [],
  },
  isLive: true,
  isNewStream: true,
  timestamp: new Date(),
});

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        Logger,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── target management ────────────────────────────────────────────────────────

  describe('addTarget()', () => {
    it('adds a target and returns it via getTargets', () => {
      const initialCount = service.getTargets().length;

      service.addTarget({ type: 'discord', config: { channelId: 'ch-1' } });

      const targets = service.getTargets();
      expect(targets).toHaveLength(initialCount + 1);
      expect(targets[targets.length - 1].type).toBe('discord');
    });
  });

  describe('removeTarget()', () => {
    it('removes a target by type', () => {
      service.addTarget({ type: 'discord', config: { channelId: 'ch-1' } });
      const countBefore = service.getTargets().length;

      service.removeTarget('discord');

      expect(service.getTargets()).toHaveLength(countBefore - 1);
    });

    it('removes by type + identifier (url)', () => {
      service.addTarget({
        type: 'webhook',
        config: { url: 'https://hook1.example.com' },
      });
      service.addTarget({
        type: 'webhook',
        config: { url: 'https://hook2.example.com' },
      });

      service.removeTarget('webhook', 'https://hook1.example.com');

      const remaining = service
        .getTargets()
        .filter((t) => t.type === 'webhook');
      expect(remaining).toHaveLength(1);
      expect(remaining[0].config.url).toBe('https://hook2.example.com');
    });

    it('does nothing when target not found', () => {
      const before = service.getTargets().length;

      service.removeTarget('discord', 'non-existent-channel');

      expect(service.getTargets()).toHaveLength(before);
    });
  });

  describe('getTargets()', () => {
    it('returns a copy of the targets array (no direct reference)', () => {
      const targets = service.getTargets();
      targets.push({ type: 'discord', config: {} });

      expect(service.getTargets()).not.toHaveLength(targets.length);
    });
  });

  // ─── sendStreamNotification ───────────────────────────────────────────────────

  describe('sendStreamNotification()', () => {
    it('sends to all registered targets without throwing', async () => {
      const notification = makeNotification();

      await expect(
        service.sendStreamNotification(notification),
      ).resolves.not.toThrow();
    });

    it('sends webhook notification via HttpService when webhook target added', async () => {
      mockHttpService.post.mockReturnValue(of({ data: 'ok', status: 200 }));
      service.addTarget({
        type: 'webhook',
        config: { url: 'https://webhook.example.com' },
      });

      await service.sendStreamNotification(makeNotification());

      expect(mockHttpService.post).toHaveBeenCalledWith(
        'https://webhook.example.com',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('does not throw when a target fails', async () => {
      mockHttpService.post.mockReturnValue(of(new Error('fail')));
      service.addTarget({
        type: 'webhook',
        config: { url: 'https://bad.example.com' },
      });

      await expect(
        service.sendStreamNotification(makeNotification()),
      ).resolves.not.toThrow();
    });
  });

  // ─── discord webhook target initialized from config ───────────────────────────

  describe('when DISCORD_WEBHOOK_URL is configured', () => {
    it('adds a webhook target on init', async () => {
      mockConfigService.get.mockReturnValue(
        'https://discord.com/api/webhooks/test',
      );

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          NotificationService,
          Logger,
          { provide: ConfigService, useValue: mockConfigService },
          { provide: HttpService, useValue: mockHttpService },
        ],
      }).compile();

      const svc = module.get<NotificationService>(NotificationService);
      const webhookTargets = svc
        .getTargets()
        .filter((t) => t.type === 'webhook');

      expect(webhookTargets).toHaveLength(1);
      expect(webhookTargets[0].config.url).toBe(
        'https://discord.com/api/webhooks/test',
      );
    });
  });
});
