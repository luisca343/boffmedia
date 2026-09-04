import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { RotomNotification } from '@/_db/schema/SmartRotom';

const TEST_UUID = 'test-user-uuid';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: NotificationsService;

  const mockNotification = {
    id: 1,
    userUuid: TEST_UUID,
    type: 'system',
    title: 'Test Notification',
    body: 'Test body',
    isRead: false,
    link: null,
    createdAt: new Date(),
  } as RotomNotification;

  const notificationsService = {
    getInbox: jest.fn(),
    createNotification: jest.fn(),
    markRead: jest.fn(),
    markAllRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    controller = module.get(NotificationsController);
    service = module.get(NotificationsService);

    jest.clearAllMocks();
  });

  describe('getUnreadCount (S10)', () => {
    it('returns the unread notification count for a user', async () => {
      notificationsService.getUnreadCount.mockResolvedValue(5);

      const result = await controller.getUnreadCount(TEST_UUID);

      expect(result).toEqual({ count: 5 });
      expect(notificationsService.getUnreadCount).toHaveBeenCalledWith(
        TEST_UUID,
      );
    });

    it('returns 0 when there are no unread notifications', async () => {
      notificationsService.getUnreadCount.mockResolvedValue(0);

      const result = await controller.getUnreadCount(TEST_UUID);

      expect(result).toEqual({ count: 0 });
    });

    it('correctly caches the unread count across calls within the TTL', async () => {
      notificationsService.getUnreadCount.mockResolvedValue(3);

      // First call
      const result1 = await controller.getUnreadCount(TEST_UUID);
      expect(result1).toEqual({ count: 3 });

      // Second call with same UUID
      const result2 = await controller.getUnreadCount(TEST_UUID);
      expect(result2).toEqual({ count: 3 });

      // Service should be called both times (caching happens in repository)
      expect(notificationsService.getUnreadCount).toHaveBeenCalledTimes(2);
    });
  });

  describe('getInbox', () => {
    it('fetches notification inbox with default pagination', async () => {
      const mockInbox = {
        items: [mockNotification],
        total: 1,
      };
      notificationsService.getInbox.mockResolvedValue(mockInbox);

      const result = await controller.getInbox({
        uuid: TEST_UUID,
        limit: undefined,
        offset: undefined,
      } as any);

      expect(result).toEqual(mockInbox);
      expect(notificationsService.getInbox).toHaveBeenCalledWith(
        TEST_UUID,
        20,
        0,
      );
    });

    it('fetches notification inbox with custom pagination', async () => {
      const mockInbox = { items: [], total: 0 };
      notificationsService.getInbox.mockResolvedValue(mockInbox);

      const result = await controller.getInbox({
        uuid: TEST_UUID,
        limit: '10',
        offset: '5',
      } as any);

      expect(result).toEqual(mockInbox);
      expect(notificationsService.getInbox).toHaveBeenCalledWith(
        TEST_UUID,
        10,
        5,
      );
    });
  });

  describe('markAllRead', () => {
    it('marks all notifications as read for a user', async () => {
      notificationsService.markAllRead.mockResolvedValue(undefined);

      await controller.markAllRead({ uuid: TEST_UUID } as any, TEST_UUID);

      expect(notificationsService.markAllRead).toHaveBeenCalledWith(
        TEST_UUID,
      );
    });
  });

  describe('markRead', () => {
    it('marks a single notification as read', async () => {
      notificationsService.markRead.mockResolvedValue(undefined);

      await controller.markRead(1, { uuid: TEST_UUID } as any, TEST_UUID);

      expect(notificationsService.markRead).toHaveBeenCalledWith(1, TEST_UUID);
    });
  });
});
