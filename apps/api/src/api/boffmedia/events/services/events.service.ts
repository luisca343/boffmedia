import { Injectable } from '@nestjs/common';
import { EventsRepository } from '../repositories/events.repository';
import { Event } from '@/_db/schema/Events';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getAllEvents(): Promise<Event[]> {
    return this.eventsRepository.findAll();
  }

  async getEventById(id: number): Promise<Event & { childEvents?: Event[] }> {
    const event = await this.eventsRepository.findById(id);
    if (!event) return null as unknown as Event & { childEvents?: Event[] };

    const childEvents = await this.eventsRepository.findChildEvents(id);

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
    return this.getEventById(result.insertId) as unknown as Promise<Event>;
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
    return this.getEventById(id);
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
}
