import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventsRepository } from '../repositories/events.repository';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';
import { CreateEventDto } from '../dto/create-event.dto';

const mockEvent = {
  id: 1,
  title: 'Tournament Season 1',
  description: 'First tournament',
  gameId: 1,
  startDate: new Date('2026-06-01'),
  endDate: null,
  visibility: 'public',
  icon: null,
  banner: null,
  type: 'tournament',
  parentId: null,
  deletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('EventsService', () => {
  let service: EventsService;
  let eventsRepository: jest.Mocked<
    Pick<
      EventsRepository,
      | 'findAll'
      | 'findById'
      | 'findChildEvents'
      | 'create'
      | 'update'
      | 'delete'
      | 'softDelete'
      | 'softDeleteChildren'
      | 'hasAttachedTournaments'
    >
  >;

  beforeEach(async () => {
    const mockEventsRepository = {
      // Added by the module-derivation work; the mock was never updated, so
      // every getEventById test threw "findModules is not a function".
      findModules: jest.fn().mockResolvedValue({ randomizer: null }),
      findAll: jest.fn(),
      findById: jest.fn(),
      findChildEvents: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      softDelete: jest.fn(),
      softDeleteChildren: jest.fn(),
      // Deleting an event is refused while a tournament hangs off it, so the
      // happy-path tests below have to say there is none.
      hasAttachedTournaments: jest.fn().mockResolvedValue(false),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: mockEventsRepository },
        { provide: AuditRepository, useValue: { record: jest.fn() } },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    eventsRepository = module.get(EventsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllEvents()', () => {
    it('should return all events', async () => {
      eventsRepository.findAll.mockResolvedValue([mockEvent] as any);

      const result = await service.getAllEvents();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tournament Season 1');
    });

    it('should return empty array when no events', async () => {
      eventsRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllEvents();

      expect(result).toEqual([]);
    });
  });

  describe('getEventById()', () => {
    it('should return event with child events', async () => {
      const childEvent = { ...mockEvent, id: 2, parentId: 1 };
      eventsRepository.findById.mockResolvedValue(mockEvent as any);
      eventsRepository.findChildEvents.mockResolvedValue([childEvent] as any);

      const result = await service.getEventById(1);

      expect(result.id).toBe(1);
      expect(result.childEvents).toHaveLength(1);
    });

    it('should return event with empty childEvents when none exist', async () => {
      eventsRepository.findById.mockResolvedValue(mockEvent as any);
      eventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.getEventById(1);

      expect(result.childEvents).toEqual([]);
    });

    it('should return null for unknown event', async () => {
      eventsRepository.findById.mockResolvedValue(null);

      const result = await service.getEventById(999);

      expect(result).toBeNull();
    });
  });

  describe('createEvent()', () => {
    const createDto: CreateEventDto = {
      title: 'New Tournament',
      description: 'Test event',
      gameId: 1,
      startDate: '2026-07-01',
      visibility: 'public' as const,
      type: 'event' as const,
      icon: '',
      banner: '',
    };

    it('should create and return the new event', async () => {
      eventsRepository.create.mockResolvedValue({ insertId: 2 } as any);
      eventsRepository.findById.mockResolvedValue({
        ...mockEvent,
        id: 2,
        title: 'New Tournament',
      } as any);
      eventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.createEvent(createDto);

      expect(result.title).toBe('New Tournament');
      expect(eventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Tournament', gameId: 1 }),
      );
    });

    it('should convert startDate string to Date object', async () => {
      eventsRepository.create.mockResolvedValue({ insertId: 1 } as any);
      eventsRepository.findById.mockResolvedValue(mockEvent as any);
      eventsRepository.findChildEvents.mockResolvedValue([]);

      await service.createEvent(createDto);

      expect(eventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ startDate: new Date('2026-07-01') }),
      );
    });
  });

  describe('updateEvent()', () => {
    const updateDto = {
      title: 'Updated Tournament',
      description: 'Updated',
      gameId: 1,
      startDate: '2026-06-15',
      visibility: 'public' as const,
      type: 'event' as const,
    };

    it('should update and return the updated event', async () => {
      eventsRepository.update.mockResolvedValue(undefined);
      eventsRepository.findById.mockResolvedValue({
        ...mockEvent,
        title: 'Updated Tournament',
      } as any);
      eventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.updateEvent(1, updateDto);

      expect(result.title).toBe('Updated Tournament');
      expect(eventsRepository.update).toHaveBeenCalledWith(
        1,
        expect.any(Object),
      );
    });
  });

  describe('deleteEvent()', () => {
    it('should soft delete the event and its children', async () => {
      eventsRepository.softDeleteChildren.mockResolvedValue(undefined);
      eventsRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteEvent(1);

      expect(eventsRepository.softDeleteChildren).toHaveBeenCalledWith(1);
      expect(eventsRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should delete children before the parent', async () => {
      const callOrder: string[] = [];
      eventsRepository.softDeleteChildren.mockImplementation(() => {
        callOrder.push('children');
        return Promise.resolve();
      });
      eventsRepository.softDelete.mockImplementation(() => {
        callOrder.push('parent');
        return Promise.resolve();
      });

      await service.deleteEvent(1);

      expect(callOrder).toEqual(['children', 'parent']);
    });

    it('refuses to delete an event that still has a tournament attached', async () => {
      eventsRepository.hasAttachedTournaments.mockResolvedValue(true);

      await expect(service.deleteEvent(1)).rejects.toThrow();
      expect(eventsRepository.softDelete).not.toHaveBeenCalled();
      expect(eventsRepository.softDeleteChildren).not.toHaveBeenCalled();
    });
  });

  describe('validateEventExists()', () => {
    it('should return true when event exists', async () => {
      eventsRepository.findById.mockResolvedValue(mockEvent as any);

      const result = await service.validateEventExists(1);

      expect(result).toBe(true);
    });

    it('should return false when event does not exist', async () => {
      eventsRepository.findById.mockResolvedValue(null);

      const result = await service.validateEventExists(999);

      expect(result).toBe(false);
    });
  });
});
