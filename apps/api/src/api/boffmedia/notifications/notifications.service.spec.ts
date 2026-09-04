import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NOTIFICATION_TYPE } from '@/_db/schema/BoffMediaNotifications';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: NotificationsRepository;
  let preferencesService: NotificationPreferencesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: {
            insert: jest.fn(),
            insertBroadcast: jest.fn(),
            upsertByDedupeKey: jest.fn(),
            findAllUserIds: jest.fn(),
          },
        },
        {
          provide: NotificationPreferencesService,
          useValue: {
            shouldDeliver: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repo = module.get<NotificationsRepository>(NotificationsRepository);
    preferencesService = module.get<NotificationPreferencesService>(
      NotificationPreferencesService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create with user notification', () => {
    it('should create notification when type is not muted', async () => {
      const dto = {
        userId: 1,
        type: NOTIFICATION_TYPE.EVENT,
        title: 'Test Event',
      };

      jest.spyOn(preferencesService, 'shouldDeliver').mockResolvedValue(true);
      jest.spyOn(repo, 'insert').mockResolvedValue(undefined);

      const result = await service.create(dto);

      expect(preferencesService.shouldDeliver).toHaveBeenCalledWith(1, NOTIFICATION_TYPE.EVENT);
      expect(repo.insert).toHaveBeenCalled();
      expect(result).toEqual({ created: 1 });
    });

    it('should NOT create notification when type is muted', async () => {
      const dto = {
        userId: 1,
        type: NOTIFICATION_TYPE.EVENT,
        title: 'Test Event',
      };

      jest.spyOn(preferencesService, 'shouldDeliver').mockResolvedValue(false);

      const result = await service.create(dto);

      expect(preferencesService.shouldDeliver).toHaveBeenCalledWith(1, NOTIFICATION_TYPE.EVENT);
      expect(repo.insert).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0 });
    });
  });

  describe('create with broadcast', () => {
    it('should respect preferences for each user in broadcast', async () => {
      const dto = {
        type: NOTIFICATION_TYPE.EVENT,
        title: 'Broadcast Event',
      };

      jest.spyOn(repo, 'findAllUserIds').mockResolvedValue([1, 2, 3]);
      jest.spyOn(preferencesService, 'shouldDeliver')
        .mockResolvedValueOnce(true)  // user 1
        .mockResolvedValueOnce(false) // user 2 (muted)
        .mockResolvedValueOnce(true); // user 3

      jest.spyOn(repo, 'insertBroadcast').mockResolvedValue(undefined);

      const result = await service.create(dto);

      expect(preferencesService.shouldDeliver).toHaveBeenCalledTimes(3);
      expect(repo.insertBroadcast).toHaveBeenCalledWith(
        [1, 3], // only users 1 and 3 should receive it
        expect.objectContaining({
          type: NOTIFICATION_TYPE.EVENT,
          title: 'Broadcast Event',
        }),
      );
      expect(result).toEqual({ created: 2 });
    });

    it('should create 0 notifications if all users have type muted', async () => {
      const dto = {
        type: NOTIFICATION_TYPE.EVENT,
        title: 'Broadcast Event',
      };

      jest.spyOn(repo, 'findAllUserIds').mockResolvedValue([1, 2]);
      jest.spyOn(preferencesService, 'shouldDeliver')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(false);

      const result = await service.create(dto);

      expect(repo.insertBroadcast).not.toHaveBeenCalled();
      expect(result).toEqual({ created: 0 });
    });
  });

  describe('create without preferences service (backward compatibility)', () => {
    it('should create notification when preferences service is not wired', async () => {
      const serviceWithoutPrefs = new NotificationsService(repo);
      const dto = {
        userId: 1,
        type: NOTIFICATION_TYPE.EVENT,
        title: 'Test Event',
      };

      jest.spyOn(repo, 'insert').mockResolvedValue(undefined);

      const result = await serviceWithoutPrefs.create(dto);

      expect(repo.insert).toHaveBeenCalled();
      expect(result).toEqual({ created: 1 });
    });
  });
});
