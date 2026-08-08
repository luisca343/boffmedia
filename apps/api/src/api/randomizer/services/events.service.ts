import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { ConfigService } from '@nestjs/config';
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
import {
  SETTINGS_SHIM_TOKEN,
  type ISettingsShim,
} from '../ports/settings-shim.port';
import { Readable } from 'stream';

/**
 * The `settings_json` column is a MySQL `json` column, but the driver hands it back
 * as a raw JSON string on read — coerce it to the object the shim/hash expect.
 */
function asSettingsObject(value: unknown): Record<string, unknown> {
  if (typeof value === 'string') {
    return JSON.parse(value) as Record<string, unknown>;
  }
  return (value ?? {}) as Record<string, unknown>;
}

/**
 * Deterministic JSON serialization with recursively sorted object keys, so the
 * settings-snapshot hash is stable regardless of property order in the stored JSON.
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.keys(value as Record<string, unknown>)
      .sort()
      .map(
        (k) =>
          `${JSON.stringify(k)}:${stableStringify(
            (value as Record<string, unknown>)[k],
          )}`,
      );
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

@Injectable()
export class EventsService {
  /** Memoized SHA-512 of the configured FVX jar (path + hash), computed on first create. */
  private jarHashCache: { path: string; sha512: string } | null = null;

  constructor(
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    @Inject(RANDOMIZER_RUNNER_TOKEN)
    private readonly runner: IRandomizerRunner,
    @Inject(SETTINGS_SHIM_TOKEN)
    private readonly settingsShim: ISettingsShim,
  ) {}

  /**
   * Direct, event-less randomization: encode a preset's settings to .rnqs, run the
   * FVX jar against an uploaded ROM, and return the randomized ROM bytes. This is the
   * "use the randomizer program directly" path — no event, assignment, or persistence.
   */
  async quickRandomize(params: {
    presetId: number;
    gamePlatform: 'gba' | 'nds';
    romBuffer: Buffer;
    seed?: number;
  }): Promise<{ romBytes: Buffer; outputSha512: string; seed: number }> {
    if (!params.presetId || params.presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }
    if (!params.romBuffer || params.romBuffer.length === 0) {
      throw new BadRequestException('ROM file is required');
    }

    const preset = await this.repository.getPresetById(params.presetId);
    if (!preset) {
      throw new BadRequestException(`Preset ${params.presetId} not found`);
    }

    // Encode the preset's stored settings JSON into the .rnqs the FVX jar consumes.
    const settingsRnqs = await this.settingsShim.encode(
      asSettingsObject(preset.settingsJson),
    );

    const seed =
      params.seed && params.seed > 0
        ? params.seed
        : randomBytes(6).readUintBE(0, 6) % Number.MAX_SAFE_INTEGER;

    const result = await this.runner.randomize({
      romStream: Readable.from(params.romBuffer),
      settingsRnqs,
      seed,
      gamePlatform: params.gamePlatform,
      jarSha512: this.getFvxJarSha512(),
    });

    this.logger.debug(
      `Quick-randomized a ${params.gamePlatform} ROM with preset ${params.presetId} (seed ${seed})`,
    );

    return { romBytes: result.romBytes, outputSha512: result.outputSha512, seed };
  }

  /**
   * SHA-512 (hex) of the configured FVX jar. The event pins the jar version used;
   * the jar itself is server-configured via env.RANDOMIZER_JAR, never sent by the client.
   */
  private getFvxJarSha512(): string {
    const env = this.configService.get<any>('env') || {};
    const jarPath: string = env.RANDOMIZER_JAR || '';
    if (!jarPath) {
      throw new BadRequestException(
        'Randomizer jar is not configured (RANDOMIZER_JAR)',
      );
    }
    if (this.jarHashCache && this.jarHashCache.path === jarPath) {
      return this.jarHashCache.sha512;
    }
    let sha512: string;
    try {
      sha512 = createHash('sha512').update(readFileSync(jarPath)).digest('hex');
    } catch (err) {
      throw new BadRequestException(
        `Cannot read configured randomizer jar at ${jarPath}: ${(err as Error).message}`,
      );
    }
    this.jarHashCache = { path: jarPath, sha512 };
    return sha512;
  }

  /**
   * Create a new randomizer event in draft status.
   *
   * The client picks a preset (whose settings snapshot is hashed into settingsBlobSha512)
   * and the server pins the configured jar (fvxJarSha512). Neither hash is client-supplied.
   */
  async createEvent(data: {
    tournamentId: number;
    gamePlatform: string;
    gameTitle: string;
    presetId: number;
    cleanRomSha512: string;
    romHint?: string;
    packId?: string;
  }): Promise<RandomizerEvent> {
    if (!data.tournamentId || data.tournamentId <= 0) {
      throw new BadRequestException('Valid tournamentId is required');
    }
    if (!data.presetId || data.presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(data.presetId);
    if (!preset) {
      throw new BadRequestException(`Preset ${data.presetId} not found`);
    }

    // Pin the settings snapshot: SHA-512 over a stable serialization of the preset's JSON.
    const settingsBlobSha512 = createHash('sha512')
      .update(stableStringify(asSettingsObject(preset.settingsJson)))
      .digest('hex');

    const fvxJarSha512 = this.getFvxJarSha512();

    try {
      const eventId = await this.repository.createEvent({
        tournamentId: data.tournamentId,
        gamePlatform: data.gamePlatform,
        gameTitle: data.gameTitle,
        settingsBlobSha512,
        fvxJarSha512,
        cleanRomSha512: data.cleanRomSha512,
        romHint: data.romHint || null,
        packId: data.packId || null,
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
    patch: { romHint?: string; packId?: string },
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
      packId: patch.packId !== undefined ? patch.packId : event.packId,
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
