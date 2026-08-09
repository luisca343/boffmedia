import { Injectable, NotFoundException } from '@nestjs/common';
import {
  EventsRepository,
  FindEventsFilters,
} from '../repositories/events.repository';
import { Event } from '@/_db/schema/BoffMediaEvents';
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
      ...(createEventDto.status ? { status: createEventDto.status } : {}),
      ...(createEventDto.packId !== undefined
        ? { packId: createEventDto.packId }
        : {}),
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
    // Only the keys actually sent are written. Building the object
    // unconditionally turned an omitted `startDate` into `new Date(undefined)`
    // — an Invalid Date that MySQL rejects — so a genuine PATCH could not work.
    const d = updateEventDto;
    const eventData: Partial<Event> = {
      ...(d.parentId !== undefined ? { parentId: d.parentId || null } : {}),
      ...(d.title !== undefined ? { title: d.title } : {}),
      ...(d.description !== undefined ? { description: d.description } : {}),
      ...(d.gameId !== undefined ? { gameId: d.gameId } : {}),
      ...(d.startDate !== undefined
        ? { startDate: new Date(d.startDate) }
        : {}),
      ...(d.endDate !== undefined
        ? { endDate: d.endDate ? new Date(d.endDate) : null }
        : {}),
      ...(d.visibility !== undefined ? { visibility: d.visibility } : {}),
      ...(d.icon !== undefined ? { icon: d.icon } : {}),
      ...(d.banner !== undefined ? { banner: d.banner } : {}),
      ...(d.type !== undefined ? { type: d.type } : {}),
      ...(d.status !== undefined ? { status: d.status } : {}),
      ...(d.packId !== undefined ? { packId: d.packId } : {}),
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

  /**
   * The events module owns the lifecycle. It used to be written from exactly
   * one place — the randomizer's `openConfig` — so an event with no randomizer
   * config could never become active and nothing ever wrote `completed`.
   */
  async setStatus(
    id: number,
    status: 'upcoming' | 'active' | 'completed',
  ): Promise<Event> {
    const event = await this.eventsRepository.findById(id, true);
    if (!event) throw new NotFoundException('Event not found');

    await this.eventsRepository.setStatus(id, status);
    return this.getEventById(id, true);
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    // includePrivate: existence is not visibility. Callers that must not leak a
    // private event use validateEventVisible instead — this one used to filter
    // private events out, which is why joining one failed as "Event not found".
    const event = await this.eventsRepository.findById(eventId, true);
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
