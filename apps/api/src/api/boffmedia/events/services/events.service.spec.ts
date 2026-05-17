import { Test, TestingModule } from '@nestjs/testing';
import { EventsService } from './events.service';
import { EventsRepository } from '../repositories/events.repository';
import { CreateEventDto } from '../dto/create-event.dto';

const mockEventsRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findChildEvents: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  softDelete: jest.fn(),
  softDeleteChildren: jest.fn(),
};

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: EventsRepository, useValue: mockEventsRepository },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllEvents()', () => {
    it('should return all events', async () => {
      mockEventsRepository.findAll.mockResolvedValue([mockEvent]);

      const result = await service.getAllEvents();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Tournament Season 1');
    });

    it('should return empty array when no events', async () => {
      mockEventsRepository.findAll.mockResolvedValue([]);

      const result = await service.getAllEvents();

      expect(result).toEqual([]);
    });
  });

  describe('getEventById()', () => {
    it('should return event with child events', async () => {
      const childEvent = { ...mockEvent, id: 2, parentId: 1 };
      mockEventsRepository.findById.mockResolvedValue(mockEvent);
      mockEventsRepository.findChildEvents.mockResolvedValue([childEvent]);

      const result = await service.getEventById(1);

      expect(result.id).toBe(1);
      expect(result.childEvents).toHaveLength(1);
    });

    it('should return event with empty childEvents when none exist', async () => {
      mockEventsRepository.findById.mockResolvedValue(mockEvent);
      mockEventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.getEventById(1);

      expect(result.childEvents).toEqual([]);
    });

    it('should return null for unknown event', async () => {
      mockEventsRepository.findById.mockResolvedValue(null);

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
      mockEventsRepository.create.mockResolvedValue({ insertId: 2 });
      mockEventsRepository.findById.mockResolvedValue({ ...mockEvent, id: 2, title: 'New Tournament' });
      mockEventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.createEvent(createDto);

      expect(result.title).toBe('New Tournament');
      expect(mockEventsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'New Tournament', gameId: 1 }),
      );
    });

    it('should convert startDate string to Date object', async () => {
      mockEventsRepository.create.mockResolvedValue({ insertId: 1 });
      mockEventsRepository.findById.mockResolvedValue(mockEvent);
      mockEventsRepository.findChildEvents.mockResolvedValue([]);

      await service.createEvent(createDto);

      expect(mockEventsRepository.create).toHaveBeenCalledWith(
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
      mockEventsRepository.update.mockResolvedValue(undefined);
      mockEventsRepository.findById.mockResolvedValue({ ...mockEvent, title: 'Updated Tournament' });
      mockEventsRepository.findChildEvents.mockResolvedValue([]);

      const result = await service.updateEvent(1, updateDto);

      expect(result.title).toBe('Updated Tournament');
      expect(mockEventsRepository.update).toHaveBeenCalledWith(1, expect.any(Object));
    });
  });

  describe('deleteEvent()', () => {
    it('should soft delete the event and its children', async () => {
      mockEventsRepository.softDeleteChildren.mockResolvedValue(undefined);
      mockEventsRepository.softDelete.mockResolvedValue(undefined);

      await service.deleteEvent(1);

      expect(mockEventsRepository.softDeleteChildren).toHaveBeenCalledWith(1);
      expect(mockEventsRepository.softDelete).toHaveBeenCalledWith(1);
    });

    it('should delete children before the parent', async () => {
      const callOrder: string[] = [];
      mockEventsRepository.softDeleteChildren.mockImplementation(() => {
        callOrder.push('children');
        return Promise.resolve();
      });
      mockEventsRepository.softDelete.mockImplementation(() => {
        callOrder.push('parent');
        return Promise.resolve();
      });

      await service.deleteEvent(1);

      expect(callOrder).toEqual(['children', 'parent']);
    });
  });

  describe('validateEventExists()', () => {
    it('should return true when event exists', async () => {
      mockEventsRepository.findById.mockResolvedValue(mockEvent);

      const result = await service.validateEventExists(1);

      expect(result).toBe(true);
    });

    it('should return false when event does not exist', async () => {
      mockEventsRepository.findById.mockResolvedValue(null);

      const result = await service.validateEventExists(999);

      expect(result).toBe(false);
    });
  });
});
