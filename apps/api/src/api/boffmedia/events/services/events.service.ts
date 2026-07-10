import { Injectable } from '@nestjs/common';
import {
  EventsRepository,
  FindEventsFilters,
} from '../repositories/events.repository';
import { Event } from '@/_db/schema/Events';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEvents(filters?: FindEventsFilters): Promise<Event[]> {
    return this.eventsRepository.findAll(filters);
  }

  async getEventById(
    id: number,
    includePrivate = false,
  ): Promise<Event & { childEvents?: Event[] }> {
    const event = await this.eventsRepository.findById(id, includePrivate);
    if (!event) return null as unknown as Event & { childEvents?: Event[] };

    const childEvents = await this.eventsRepository.findChildEvents(
      id,
      includePrivate,
    );

    return {
      ...event,
      childEvents: childEvents.length > 0 ? childEvents : [],
    };
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const eventData = {
      parentId: createEventDto.parentId || null,
      title: createEventDto.title,
      description: createEventDto.description,
      gameId: createEventDto.gameId,
      startDate: new Date(createEventDto.startDate),
      endDate: createEventDto.endDate ? new Date(createEventDto.endDate) : null,
      visibility: createEventDto.visibility,
      icon: createEventDto.icon,
      banner: createEventDto.banner,
      type: createEventDto.type,
    };

    const result = await this.eventsRepository.create(eventData);
    // Admin op: return the full saved event even when it's private.
    return this.getEventById(
      result.insertId,
      true,
    ) as unknown as Promise<Event>;
  }

  async updateEvent(
    id: number,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    const eventData = {
      parentId: updateEventDto.parentId || null,
      title: updateEventDto.title,
      description: updateEventDto.description,
      gameId: updateEventDto.gameId,
      startDate: new Date(updateEventDto.startDate!),
      endDate: updateEventDto.endDate ? new Date(updateEventDto.endDate) : null,
      visibility: updateEventDto.visibility,
      icon: updateEventDto.icon,
      banner: updateEventDto.banner,
      type: updateEventDto.type,
    };

    await this.eventsRepository.update(id, eventData);
    // Admin op: return the full updated event even when it's private.
    return this.getEventById(id, true);
  }

  async deleteEvent(id: number): Promise<void> {
    // First, soft delete all child events
    await this.eventsRepository.softDeleteChildren(id);

    // Then soft delete the main event
    await this.eventsRepository.softDelete(id);
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    const event = await this.eventsRepository.findById(eventId);
    return !!event;
  }

  /**
   * Like validateEventExists, but a private event counts as "not visible" for
   * non-admins (includePrivate=false) — so its sub-resources return not-found
   * to the public instead of leaking the event's existence/data.
   */
  async validateEventVisible(
    eventId: number,
    includePrivate = false,
  ): Promise<boolean> {
    const event = await this.eventsRepository.findById(eventId, includePrivate);
    return !!event;
  }
}
