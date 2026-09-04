import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { NotificationPreferencesRepository } from './notification-preferences.repository';
import { NOTIFICATION_TYPE } from '@/_db/schema/BoffMediaNotifications';

describe('NotificationPreferencesRepository', () => {
  let repository: NotificationPreferencesRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationPreferencesRepository,
        {
          provide: DRIZZLE,
          useValue: {
            insert: jest.fn(),
            select: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    repository = module.get<NotificationPreferencesRepository>(
      NotificationPreferencesRepository,
    );
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('isMuted', () => {
    it('should return false when no preference row exists', async () => {
      jest.spyOn(repository, 'findByUserAndType').mockResolvedValue(null);

      const result = await repository.isMuted(1, NOTIFICATION_TYPE.EVENT);

      expect(result).toBe(false);
    });

    it('should return isMuted value when preference exists', async () => {
      jest.spyOn(repository, 'findByUserAndType').mockResolvedValue({
        id: 1,
        userId: 1,
        type: NOTIFICATION_TYPE.EVENT,
        isMuted: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await repository.isMuted(1, NOTIFICATION_TYPE.EVENT);

      expect(result).toBe(true);
    });
  });
});
