import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Logger } from 'nestjs-pino';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import type {
  RandomizerEvent,
  NewRandomizerEvent,
  RandomizerEventStatus,
  NewRandomizerAssignment,
} from '@/_db/schema/Randomizer';
import {
  RANDOMIZER_RUNNER_TOKEN,
  type IRandomizerRunner,
  type RandomizeJob,
} from '../ports/randomizer-runner.port';
import { Readable } from 'stream';

@Injectable()
export class EventsService {
  constructor(
    private readonly logger: Logger,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    @Inject(RANDOMIZER_RUNNER_TOKEN)
    private readonly runner: IRandomizerRunner,
  ) {}

  /**
   * Create a new randomizer event in draft status.
   */
  async createEvent(data: {
    tournamentId: number;
    gamePlatform: string;
    gameTitle: string;
    settingsBlobSha512: string;
    fvxJarSha512: string;
    cleanRomSha512: string;
    romHint?: string;
  }): Promise<RandomizerEvent> {
    if (!data.tournamentId || data.tournamentId <= 0) {
      throw new BadRequestException('Valid tournamentId is required');
    }

    try {
      const eventId = await this.repository.createEvent({
        tournamentId: data.tournamentId,
        gamePlatform: data.gamePlatform,
        gameTitle: data.gameTitle,
        settingsBlobSha512: data.settingsBlobSha512,
        fvxJarSha512: data.fvxJarSha512,
        cleanRomSha512: data.cleanRomSha512,
        romHint: data.romHint || null,
        status: 'draft',
      } as NewRandomizerEvent);

      const event = await this.repository.getEventById(eventId);
      if (!event) {
        throw new Error('Failed to retrieve created event');
      }

      this.logger.debug(
        `Created randomizer event ${eventId} for tournament ${data.tournamentId}`,
      );
      return event;
    } catch (error: any) {
      this.logger.error('Failed to create event:', error);
      throw error;
    }
  }

  /**
   * Get an event by ID.
   */
  async getEvent(eventId: number): Promise<RandomizerEvent> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    return event;
  }

  /**
   * List all events for a tournament.
   */
  async listEventsByTournament(
    tournamentId: number,
  ): Promise<RandomizerEvent[]> {
    if (!tournamentId || tournamentId <= 0) {
      throw new BadRequestException('Valid tournamentId is required');
    }

    return this.repository.listEventsByTournament(tournamentId);
  }

  /**
   * Update an event (only when status=draft).
   */
  async updateEvent(
    eventId: number,
    patch: { romHint?: string },
  ): Promise<RandomizerEvent> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.getEvent(eventId);

    if (event.status !== 'draft') {
      throw new ConflictException(
        `Cannot update event ${eventId}: status is ${event.status}, not draft`,
      );
    }

    await this.repository.updateEvent(eventId, {
      romHint: patch.romHint !== undefined ? patch.romHint : event.romHint,
    });

    return this.getEvent(eventId);
  }

  /**
   * Lock an event: generate seeds, create assignments, audit.
   *
   * - Loads checked-in participants for the tournament
   * - Generates ONE cryptographically-safe seed per participant in range [0, MAX_SAFE_INTEGER)
   * - Creates assignments with status=pending
   * - Sets event.status=locked
   * - Audits SEED_GENERATED
   */
  async lockEvent(eventId: number, actor?: string): Promise<RandomizerEvent> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.getEvent(eventId);

    if (event.status !== 'draft') {
      throw new ConflictException(
        `Cannot lock event ${eventId}: status is ${event.status}, not draft`,
      );
    }

    // Load checked-in participants
    const participants = await this.repository.listCheckedInParticipants(
      event.tournamentId,
    );

    if (participants.length === 0) {
      throw new BadRequestException(
        `No checked-in participants for tournament ${event.tournamentId}`,
      );
    }

    // Generate one seed per participant using cryptographically-safe randomness
    const assignments: NewRandomizerAssignment[] = participants.map(
      (participant) => {
        // Generate random bytes and convert to safe integer [0, MAX_SAFE_INTEGER)
        // Use 6 bytes = 48 bits, then mask to ensure it's < MAX_SAFE_INTEGER (2^53 - 1)
        const randomBytes6 = randomBytes(6);
        const seed = randomBytes6.readUintBE(0, 6) % Number.MAX_SAFE_INTEGER;

        return {
          eventId,
          participantId: participant.id,
          mcUuid: null,
          seed,
          status: 'pending' as const,
        } as NewRandomizerAssignment;
      },
    );

    // Create assignments
    await this.repository.createAssignments(assignments);

    // Set event status to locked
    await this.repository.updateEvent(eventId, {
      status: 'locked' as RandomizerEventStatus,
    });

    // Audit
    await this.repository.appendAudit({
      eventId,
      action: 'SEED_GENERATED',
      actor: actor || 'system',
      meta: { participantCount: participants.length },
    });

    this.logger.debug(
      `Locked event ${eventId} with ${participants.length} seeds generated`,
    );

    return this.getEvent(eventId);
  }

  /**
   * Finish an event: set status=finished, audit UNSEALED.
   */
  async finishEvent(eventId: number, actor?: string): Promise<RandomizerEvent> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.getEvent(eventId);

    if (event.status === 'finished') {
      throw new ConflictException(`Event ${eventId} is already finished`);
    }

    await this.repository.updateEvent(eventId, {
      status: 'finished' as RandomizerEventStatus,
    });

    await this.repository.appendAudit({
      eventId,
      action: 'UNSEALED',
      actor: actor || 'system',
    });

    this.logger.debug(`Finished event ${eventId}`);

    return this.getEvent(eventId);
  }

  /**
   * Dry-run randomization: admin uploads a ROM, server validates and calls runner.
   * Returns the randomized ROM as bytes (does NOT store it).
   *
   * Throws if runner is not wired (Phase 0).
   */
  async dryRunRandomization(
    eventId: number,
    romStream: Readable,
  ): Promise<{ randomizedRom: Readable; logBytes: Buffer }> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.getEvent(eventId);

    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // TODO: fetch settings blob from disk (storeBlob managed PacksDownloadsService)
    // For now, just call runner with stub data to trigger the ServiceUnavailableException
    const job: RandomizeJob = {
      romStream,
      settingsRnqs: Buffer.alloc(0), // Stub
      seed: 0,
      gamePlatform: event.gamePlatform as 'gba' | 'nds',
      jarSha512: event.fvxJarSha512,
    };

    const result = await this.runner.randomize(job);

    return {
      randomizedRom: Readable.from(Buffer.alloc(0)), // Stub: would be the ROM bytes
      logBytes: result.logBytes,
    };
  }
}
