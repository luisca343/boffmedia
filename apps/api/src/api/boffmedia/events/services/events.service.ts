import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventsRepository,
  FindEventsFilters,
} from '../repositories/events.repository';
import {
  AUDIT_SUBJECT,
  Event,
  EVENT_STATUS,
} from '@/_db/schema/BoffMediaEvents';
import type { EventModules } from '../entities/event.entity';
import { CreateEventDto } from '../dto/create-event.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';
import { ApiErrorCode, userError } from '@/common/errors/user-error';

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly audit: AuditRepository,
  ) {}

  async getAllEvents(filters?: FindEventsFilters): Promise<Event[]> {
    return this.eventsRepository.findAll(filters);
  }

  async getEventById(
    id: number,
    includePrivate = false,
    userId?: number,
  ): Promise<Event & { childEvents?: Event[]; modules?: EventModules }> {
    const effectivePrivate = await this.canSeePrivate(
      id,
      includePrivate,
      userId,
    );
    const event = await this.eventsRepository.findById(id, effectivePrivate);
    if (!event)
      return null as unknown as Event & {
        childEvents?: Event[];
        modules?: EventModules;
      };

    const [childEvents, modules] = await Promise.all([
      this.eventsRepository.findChildEvents(id, effectivePrivate),
      this.eventsRepository.findModules(id),
    ]);

    return {
      ...event,
      childEvents: childEvents.length > 0 ? childEvents : [],
      modules,
    };
  }

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const eventData = {
      parentId: createEventDto.parentId || null,
      title: createEventDto.title,
      description: createEventDto.description,
      gameId: createEventDto.gameId,
      // Undated events are legal — the date can be filled in later, or never.
      startDate: createEventDto.startDate
        ? new Date(createEventDto.startDate)
        : null,
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
      // Sending `startDate: null` clears the date; omitting the key leaves it.
      ...(d.startDate !== undefined
        ? { startDate: d.startDate ? new Date(d.startDate) : null }
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
   * The events module owns the lifecycle. It must not be driven from the
   * randomizer's `openConfig` alone: an event with no randomizer config would
   * never become active, and nothing would ever write `completed`.
   */
  /**
   * The event lifecycle runs forward: upcoming → active → completed. Going
   * backwards is a real operation (an event closed by mistake) but never an
   * accidental one, so it needs `reopen: true` and leaves an audit row.
   *
   * The guard that matters is the randomizer's: minting a seed requires the
   * event to be ACTIVE, so a completed → active flip re-arms claiming on an
   * event whose settings have already been published. That inverts the
   * "secrecy before, verifiability after" contract, so it is refused outright
   * while a non-draft config is attached rather than merely logged.
   */
  async setStatus(
    id: number,
    status: 'upcoming' | 'active' | 'completed',
    opts: { reopen?: boolean; actorUserId?: number | null } = {},
  ): Promise<Event> {
    const event = await this.eventsRepository.findById(id, true);
    if (!event) throw new NotFoundException('Event not found');

    const rank = (s: string): number =>
      s === EVENT_STATUS.COMPLETED ? 2 : s === EVENT_STATUS.ACTIVE ? 1 : 0;
    const from = event.status as 'upcoming' | 'active' | 'completed';
    const backwards = rank(status) < rank(from);

    if (backwards) {
      if (!opts.reopen) {
        throw new BadRequestException(
          userError(
            ApiErrorCode.EVENT_LIFECYCLE_FORWARD_ONLY,
            `The event lifecycle only moves forward (${from} → ${status} needs reopen: true)`,
          ),
        );
      }
      const { randomizer } = await this.eventsRepository.findModules(id);
      // `findModules` maps a draft config to null, which is exactly the set we
      // want to allow: a draft has published nothing, so nothing is at risk.
      if (randomizer !== null) {
        throw new BadRequestException(
          userError(
            ApiErrorCode.EVENT_REOPEN_BLOCKED_BY_RANDOMIZER,
            `Cannot reopen: this event has a ${randomizer} randomizer config. Close or delete it first — reopening would let players mint new seeds against published settings.`,
          ),
        );
      }
    }

    if (from !== status) {
      await this.eventsRepository.setStatus(id, status);
      await this.audit.record(
        AUDIT_SUBJECT.EVENT,
        id,
        backwards ? 'event.reopen' : 'event.status',
        opts.actorUserId ?? null,
        { from, to: status },
      );
    }
    return this.getEventById(id, true);
  }

  /** Which optional modules the event composes (randomizer, tournament). */
  async getModules(eventId: number): Promise<EventModules> {
    return this.eventsRepository.findModules(eventId);
  }

  async validateEventExists(eventId: number): Promise<boolean> {
    // includePrivate: existence is not visibility. Callers that must not leak a
    // private event use validateEventVisible instead. Filtering private events
    // out here makes joining one fail as "Event not found".
    const event = await this.eventsRepository.findById(eventId, true);
    return !!event;
  }

  /**
   * Like validateEventExists, but a private event counts as "not visible" for
   * non-admins — so its sub-resources return not-found to the public instead of
   * leaking the event's existence/data. Admins (includePrivate) and the event's
   * own participants (userId) can see it even when private.
   */
  async validateEventVisible(
    eventId: number,
    includePrivate = false,
    userId?: number,
  ): Promise<boolean> {
    const effectivePrivate = await this.canSeePrivate(
      eventId,
      includePrivate,
      userId,
    );
    const event = await this.eventsRepository.findById(
      eventId,
      effectivePrivate,
    );
    return !!event;
  }

  /** See EventsRepository.hiddenPrivateEventIds. */
  async hiddenPrivateEventIds(
    eventIds: (number | null | undefined)[],
    userId?: number,
  ): Promise<Set<number>> {
    return this.eventsRepository.hiddenPrivateEventIds(eventIds, userId);
  }

  /** Admins, or an authenticated participant of the event, may see private data. */
  private async canSeePrivate(
    eventId: number,
    includePrivate: boolean,
    userId?: number,
  ): Promise<boolean> {
    if (includePrivate) return true;
    if (
      userId &&
      (await this.eventsRepository.isParticipant(eventId, userId))
    ) {
      return true;
    }
    return false;
  }
}
