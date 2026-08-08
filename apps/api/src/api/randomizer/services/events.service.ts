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
  RandomizerConfig,
  NewRandomizerConfig,
  RandomizerConfigStatus,
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
   * "use the randomizer program directly" path — no config, assignment, or persistence.
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
   * SHA-512 (hex) of the configured FVX jar. The config pins the jar version used;
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
   * Create a new randomizer config in draft status for an existing event.
   *
   * The client picks a preset (whose settings snapshot is hashed into settingsBlobSha512)
   * and the server pins the configured jar (fvxJarSha512). Neither hash is client-supplied.
   */
  async createConfig(data: {
    eventId: number;
    gamePlatform: string;
    gameTitle: string;
    presetId: number;
    cleanRomSha512: string;
    packId: string;
    romHint?: string;
  }): Promise<RandomizerConfig> {
    if (!data.eventId || data.eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }
    if (!data.presetId || data.presetId <= 0) {
      throw new BadRequestException('Valid presetId is required');
    }

    const preset = await this.repository.getPresetById(data.presetId);
    if (!preset) {
      throw new BadRequestException(`Preset ${data.presetId} not found`);
    }

    // The pack is what makes the config reachable in the launcher (pack → event
    // → config). Validate it up front and attach it to the event in the same
    // transaction as the insert, so a config can never exist unreachable.
    await this.assertPackAttachable(data.packId, data.eventId);

    // Pin the settings snapshot: SHA-512 over a stable serialization of the preset's JSON.
    const settingsBlobSha512 = createHash('sha512')
      .update(stableStringify(asSettingsObject(preset.settingsJson)))
      .digest('hex');

    const fvxJarSha512 = this.getFvxJarSha512();

    const configId = await this.repository.createConfigAndAttachPack(
      {
        eventId: data.eventId,
        gamePlatform: data.gamePlatform,
        gameTitle: data.gameTitle,
        settingsBlobSha512,
        fvxJarSha512,
        cleanRomSha512: data.cleanRomSha512,
        romHint: data.romHint || null,
        status: 'draft',
      } as NewRandomizerConfig,
      data.packId,
    );

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new Error('Failed to retrieve created config');
    }

    this.logger.debug(
      `Created randomizer config ${configId} for event ${data.eventId}, pack ${data.packId}`,
    );
    return config;
  }

  /**
   * Validate that a pack can be attached to an event: it must exist, be an
   * emulator pack, and not already be claimed by a different event (the launcher
   * resolves a pack to a single event).
   */
  private async assertPackAttachable(
    packId: string,
    eventId: number,
  ): Promise<void> {
    if (!packId) {
      throw new BadRequestException('A pack is required');
    }
    const pack = await this.repository.getEmulatorPack(packId);
    if (!pack) {
      throw new BadRequestException(
        `Pack ${packId} not found or is not an emulator pack`,
      );
    }
    const other = await this.repository.findEventHoldingPack(packId, eventId);
    if (other !== null) {
      throw new ConflictException({
        message: `Pack ${packId} is already attached to event ${other}`,
        userMessage:
          'Este pack ya está vinculado a otro evento. Elige un pack distinto.',
      });
    }
  }

  /**
   * Get a config by ID.
   */
  async getConfig(configId: number): Promise<RandomizerConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    return config;
  }

  /**
   * Get a config by event ID.
   */
  async getConfigByEventId(eventId: number): Promise<RandomizerConfig> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const config = await this.repository.getConfigByEventId(eventId);
    if (!config) {
      throw new NotFoundException(
        `No config found for event ${eventId}`,
      );
    }

    return config;
  }

  /**
   * List all configs.
   */
  async listConfigs(): Promise<RandomizerConfig[]> {
    return this.repository.listConfigs();
  }

  /**
   * Update a config (only when status=draft).
   */
  async updateConfig(
    configId: number,
    patch: { romHint?: string; packId?: string },
  ): Promise<RandomizerConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'draft') {
      throw new ConflictException(
        `Cannot update config ${configId}: status is ${config.status}, not draft`,
      );
    }

    // Re-attach to a different pack if asked (validated the same as create).
    if (patch.packId !== undefined) {
      await this.assertPackAttachable(patch.packId, config.eventId);
      await this.repository.attachPackToEvent(config.eventId, patch.packId);
    }

    await this.repository.updateConfig(configId, {
      romHint: patch.romHint !== undefined ? patch.romHint : config.romHint,
    });

    return this.getConfig(configId);
  }

  /**
   * Open a config: transitions draft → open, allowing claims to begin.
   */
  async openConfig(configId: number, actor?: string): Promise<RandomizerConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'draft') {
      throw new ConflictException(
        `Cannot open config ${configId}: status is ${config.status}, not draft`,
      );
    }

    // Opening is the admin's "go live" action, so it also activates the event —
    // the last gate the launcher needs (pack + active event + open config). The
    // event must already have a pack (attached at create); guard so we never
    // open a config that can't actually be reached.
    const ev = await this.repository.getEventPackAndStatus(config.eventId);
    if (!ev?.packId) {
      throw new ConflictException({
        message: `Event ${config.eventId} has no pack attached`,
        userMessage:
          'El evento no tiene un pack vinculado. Vuelve a guardar la configuración con un pack.',
      });
    }

    await this.repository.updateConfig(configId, {
      status: 'open' as RandomizerConfigStatus,
    });

    if (ev.status !== 'active') {
      await this.repository.setEventStatus(config.eventId, 'active');
    }

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_OPENED',
      actor: actor || 'system',
    });

    this.logger.debug(
      `Opened config ${configId} and activated event ${config.eventId}`,
    );

    return this.getConfig(configId);
  }

  /**
   * Close a config: transitions open → closed, stopping new claims but allowing patching/verify.
   */
  async closeConfig(configId: number, actor?: string): Promise<RandomizerConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'open') {
      throw new ConflictException(
        `Cannot close config ${configId}: status is ${config.status}, not open`,
      );
    }

    await this.repository.updateConfig(configId, {
      status: 'closed' as RandomizerConfigStatus,
    });

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_CLOSED',
      actor: actor || 'system',
    });

    this.logger.debug(`Closed config ${configId}`);

    return this.getConfig(configId);
  }

  /**
   * Publish a config: transitions any status → published, making seeds/settings/logs public.
   */
  async publishConfig(configId: number, actor?: string): Promise<RandomizerConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    // Can publish from any state
    await this.repository.updateConfig(configId, {
      status: 'published' as RandomizerConfigStatus,
    });

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_OPENED', // Reuse audit action for now; consider adding 'CONFIG_PUBLISHED' if needed
      actor: actor || 'system',
    });

    this.logger.debug(`Published config ${configId}`);

    return this.getConfig(configId);
  }

  /**
   * Dry-run randomization: admin uploads a ROM, server validates and calls runner.
   * Returns the randomized ROM as bytes (does NOT store it).
   *
   * Throws if runner is not wired (Phase 0).
   */
  async dryRunRandomization(
    configId: number,
    romStream: Readable,
  ): Promise<{ randomizedRom: Readable; logBytes: Buffer }> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // TODO: fetch settings blob from disk (storeBlob managed PacksDownloadsService)
    // For now, just call runner with stub data to trigger the ServiceUnavailableException
    const job: RandomizeJob = {
      romStream,
      settingsRnqs: Buffer.alloc(0), // Stub
      seed: 0,
      gamePlatform: config.gamePlatform as 'gba' | 'nds',
      jarSha512: config.fvxJarSha512,
    };

    const result = await this.runner.randomize(job);

    return {
      randomizedRom: Readable.from(Buffer.alloc(0)), // Stub: would be the ROM bytes
      logBytes: result.logBytes,
    };
  }
}
