import {
  HttpException,
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
} from '../ports/randomizer-runner.port';
import {
  SETTINGS_SHIM_TOKEN,
  type ISettingsShim,
} from '../ports/settings-shim.port';
import { Readable } from 'stream';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';

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

export type ResolutionIssue =
  | 'no-pack'
  | 'event-not-active'
  | 'config-not-open';

export type EnrichedConfig = RandomizerConfig & {
  packId: string | null;
  launcherResolvable: boolean;
  resolutionIssue: ResolutionIssue | null;
};

/** First broken gate in the launcher resolution chain, or null when it resolves. */
function diagnose(
  config: RandomizerConfig,
  ev: { packId: string | null; status: string } | null,
): ResolutionIssue | null {
  if (!ev?.packId) return 'no-pack';
  if (ev.status !== 'active') return 'event-not-active';
  if (config.status !== 'open') return 'config-not-open';
  return null;
}

function enrich(
  config: RandomizerConfig,
  ev: { packId: string | null; status: string } | null,
): EnrichedConfig {
  const issue = diagnose(config, ev);
  return {
    ...config,
    packId: ev?.packId ?? null,
    launcherResolvable: issue === null,
    resolutionIssue: issue,
  };
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
    private readonly blobStorage: PacksDownloadsService,
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
        : randomBytes(6).readUintBE(0, 6);

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

    return {
      romBytes: result.romBytes,
      outputSha512: result.outputSha512,
      seed,
    };
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
    romId: number;
    packId: string;
    romHint?: string;
  }): Promise<EnrichedConfig> {
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

    // Resolve the library ROM: the server pins its sha512 (execution value) and
    // records rom_id (provenance). Replacing a library entry later never silently
    // changes this config, because the hash is copied here, not referenced live.
    const rom = await this.resolveLibraryRom(data.romId, data.gamePlatform);

    // The pack is what makes the config reachable in the launcher (pack → event
    // → config). Validate it up front and attach it to the event in the same
    // transaction as the insert, so a config can never exist unreachable.
    await this.assertPackAttachable(data.packId, data.eventId, rom.sha512);

    // Pin the settings snapshot: SHA-512 over a stable serialization of the preset's JSON.
    const settingsJsonString = stableStringify(
      asSettingsObject(preset.settingsJson),
    );
    const computedSha512 = createHash('sha512')
      .update(settingsJsonString)
      .digest('hex');

    // Persist the settings JSON bytes to blob storage
    const { sha512: storedSha512 } = await this.blobStorage.storeBlob(
      Readable.from([Buffer.from(settingsJsonString)]),
    );

    // Verify the stored hash matches the computed hash (content-addressed integrity check)
    if (storedSha512 !== computedSha512) {
      this.logger.error(
        `Settings blob hash mismatch: computed ${computedSha512}, stored ${storedSha512}`,
      );
      throw new Error('Settings blob hash mismatch (integrity check failed)');
    }

    const fvxJarSha512 = this.getFvxJarSha512();

    const configId = await this.repository.createConfigAndAttachPack(
      {
        eventId: data.eventId,
        gamePlatform: data.gamePlatform,
        gameTitle: data.gameTitle,
        settingsBlobSha512: storedSha512,
        fvxJarSha512,
        cleanRomSha512: rom.sha512,
        romId: rom.id,
        romHint: data.romHint || null,
        status: 'draft',
      } as NewRandomizerConfig,
      data.packId,
    );

    this.logger.debug(
      `Created randomizer config ${configId} for event ${data.eventId}, pack ${data.packId}`,
    );
    return this.getConfig(configId);
  }

  /**
   * Helper: fetch settings JSON bytes for a config, with heal-on-miss logic.
   *
   * Try to read the blob from disk; if not found, scan all presets, compute each
   * preset's stable-JSON hash, and if one matches config.settingsBlobSha512, store
   * the blob (healing the config) and return the bytes. If no preset matches, throw
   * a ConflictException with a clear message.
   *
   * This heals configs that were created before settings blobs were persisted.
   */
  async settingsJsonBytesForConfig(config: RandomizerConfig): Promise<Buffer> {
    if (!config.settingsBlobSha512) {
      throw new BadRequestException(
        `Config ${config.id} has no settings blob SHA512`,
      );
    }

    // Try to read the blob from disk
    try {
      const { stream } = await this.blobStorage.override(
        config.settingsBlobSha512,
      );
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        stream.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        stream.on('error', (err) => {
          reject(err);
        });
      });
    } catch (err: unknown) {
      this.logger.debug(
        `Settings blob ${config.settingsBlobSha512} not found; scanning presets for heal...`,
      );

      // Blob not found. Scan all presets to find a match by hash.
      const presets = await this.repository.listPresets();

      for (const preset of presets) {
        const presetJsonString = stableStringify(
          asSettingsObject(preset.settingsJson),
        );
        const presetSha512 = createHash('sha512')
          .update(presetJsonString)
          .digest('hex');

        if (presetSha512 === config.settingsBlobSha512) {
          // Found a matching preset. Store the blob and return the bytes.
          this.logger.debug(
            `Found matching preset ${preset.id} for config ${config.id}; healing blob...`,
          );

          const { sha512: storedSha512 } = await this.blobStorage.storeBlob(
            Readable.from([Buffer.from(presetJsonString)]),
          );

          if (storedSha512 !== config.settingsBlobSha512) {
            this.logger.error(
              `Heal: preset ${preset.id} blob hash mismatch: expected ${config.settingsBlobSha512}, got ${storedSha512}`,
            );
            // A typed HTTP error (404/403/409…) has to reach the client as itself;
            // wrapping it in a bare Error turned all of them into 500s.
            if (err instanceof HttpException) throw err;
            throw new Error('Settings blob hash mismatch during heal');
          }

          return Buffer.from(presetJsonString);
        }
      }

      // No matching preset found
      throw new ConflictException({
        message: `Config ${config.id}: settings blob missing and no preset matches SHA512 ${config.settingsBlobSha512}. The config is corrupted and cannot be recovered.`,
        userMessage:
          'La configuración está corrupta y no se puede recuperar. Contacta al administrador.',
      });
    }
  }

  /**
   * Validate that a pack can be attached to an event: it must exist, be an
   * emulator pack, and not already be claimed by a different event (the launcher
   * resolves a pack to a single event).
   */
  /**
   * Resolve a library ROM for pinning into a config: it must exist, match the
   * config's platform, and its blob must be present on disk (so the server can
   * actually generate ROMs from it). Returns the row whose sha512/id get pinned.
   */
  private async resolveLibraryRom(
    romId: number,
    gamePlatform: string,
  ): Promise<{ id: number; sha512: string }> {
    if (!romId || romId <= 0) {
      throw new BadRequestException('A base ROM must be selected (romId)');
    }
    const rom = await this.repository.getRomById(romId);
    if (!rom) {
      throw new BadRequestException(`ROM ${romId} not found in the library`);
    }
    if (rom.gamePlatform !== gamePlatform) {
      throw new BadRequestException({
        message: `ROM ${romId} is ${rom.gamePlatform}, but the config is ${gamePlatform}`,
        userMessage:
          'La ROM elegida no es de la misma plataforma que la configuración.',
      });
    }
    const size = await this.blobStorage.blobSize(rom.sha512);
    if (size === null) {
      throw new BadRequestException({
        message: `ROM ${romId} blob ${rom.sha512.slice(0, 8)}… is not on disk`,
        userMessage:
          'El archivo de esa ROM no está disponible en el servidor. Vuelve a subirla.',
      });
    }
    return { id: rom.id, sha512: rom.sha512 };
  }

  private async assertPackAttachable(
    packId: string,
    eventId: number,
    cleanRomSha512?: string,
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
    if (cleanRomSha512) {
      // Attach-time: a pack with nothing published yet is fine (openConfig
      // re-asserts strictly), but a published version whose emulator ROM
      // differs from the pinned clean ROM would disarm the launcher's
      // clean-ROM gate — reject it now, where the admin can fix it.
      await this.assertPublishedRomMatchesPack(packId, cleanRomSha512, {
        requirePublished: false,
      });
    }
  }

  /**
   * Anti-cheat invariant: the ROM the pack's published version ships must be
   * the exact clean ROM the config pinned, or the launcher's expected-vs-clean
   * comparison never fires and players can supply their own dump.
   */
  private async assertPublishedRomMatchesPack(
    packId: string,
    cleanRomSha512: string,
    opts: { requirePublished: boolean },
  ): Promise<void> {
    const pub = await this.repository.getPublishedEmulatorRom(packId);
    if (!pub || pub.state === 'no-version') {
      if (opts.requirePublished) {
        throw new ConflictException({
          message: `Pack ${packId} has no published version with an emulator ROM`,
          userMessage:
            'El pack no tiene ninguna versión publicada con ROM de emulador. Publica una versión del pack antes de abrir la configuración.',
        });
      }
      return;
    }
    if (pub.state === 'no-rom') {
      throw new ConflictException({
        message: `Pack ${packId}: published version declares no resolvable emulator ROM entry`,
        userMessage:
          'La versión publicada del pack no declara una ROM de emulador válida. Corrige el pack antes de continuar.',
      });
    }
    if (pub.sha512 !== cleanRomSha512) {
      throw new ConflictException({
        message: `Pack ${packId}: published emulator ROM sha512 ${pub.sha512.slice(0, 8)}… (version ${pub.versionId}, ${pub.romPath}) does not match the config's clean ROM ${cleanRomSha512.slice(0, 8)}…`,
        userMessage:
          'La ROM que distribuye el pack publicado no coincide con la ROM base elegida para el evento: el anti-trampas no funcionaría. Corrige la versión del pack o elige la ROM correcta de la biblioteca.',
      });
    }
  }

  /**
   * Get a config by ID.
   */
  async getConfig(configId: number): Promise<EnrichedConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    const ev = await this.repository.getEventPackAndStatus(config.eventId);
    return enrich(config, ev);
  }

  /**
   * Get a config by event ID.
   */
  async getConfigByEventId(eventId: number): Promise<EnrichedConfig> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const config = await this.repository.getConfigByEventId(eventId);
    if (!config) {
      throw new NotFoundException(`No config found for event ${eventId}`);
    }

    const ev = await this.repository.getEventPackAndStatus(config.eventId);
    return enrich(config, ev);
  }

  /**
   * List all configs.
   */
  async listConfigs(): Promise<EnrichedConfig[]> {
    const rows = await this.repository.listConfigsWithEventMeta();
    return rows.map(({ config, packId, eventStatus }) =>
      enrich(config, { packId, status: eventStatus }),
    );
  }

  /**
   * Update a config (only when status=draft).
   */
  async updateConfig(
    configId: number,
    patch: { romHint?: string; packId?: string; romId?: number },
  ): Promise<EnrichedConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    // Selecting a base ROM is allowed while draft OR whenever the config has no
    // library ROM yet (the migrated event-2 case: re-pin its base ROM without
    // touching the preserved assignment/seed). Other edits stay draft-only.
    const isRepairingRom = patch.romId !== undefined && config.romId == null;
    if (config.status !== 'draft' && !isRepairingRom) {
      throw new ConflictException(
        `Cannot update config ${configId}: status is ${config.status}, not draft`,
      );
    }

    // Resolve the new base ROM first: pack/ROM consistency is validated
    // against the sha512 the config will END UP with, not the current one.
    const resolvedRom =
      patch.romId !== undefined
        ? await this.resolveLibraryRom(patch.romId, config.gamePlatform)
        : null;
    const effectiveCleanSha = resolvedRom?.sha512 ?? config.cleanRomSha512;

    // Re-attach to a different pack if asked (validated the same as create).
    if (patch.packId !== undefined) {
      await this.assertPackAttachable(
        patch.packId,
        config.eventId,
        effectiveCleanSha,
      );
      await this.repository.attachPackToEvent(config.eventId, patch.packId);
    } else if (resolvedRom) {
      // ROM changed without changing the pack: the currently attached pack (if
      // any) must still ship this exact ROM in its published version.
      const ev = await this.repository.getEventPackAndStatus(config.eventId);
      if (ev?.packId) {
        await this.assertPublishedRomMatchesPack(ev.packId, effectiveCleanSha, {
          requirePublished: false,
        });
      }
    }

    const update: {
      romHint?: string | null;
      cleanRomSha512?: string;
      romId?: number;
    } = {
      romHint: patch.romHint !== undefined ? patch.romHint : config.romHint,
    };

    // Re-select the base ROM: re-pin sha512 + record provenance.
    if (resolvedRom) {
      update.romId = resolvedRom.id;
      update.cleanRomSha512 = resolvedRom.sha512;
    }

    await this.repository.updateConfig(configId, update);

    return this.getConfig(configId);
  }

  /**
   * Open a config: transitions draft → open, allowing claims to begin.
   */
  async openConfig(configId: number, actor?: string): Promise<EnrichedConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'draft') {
      throw new ConflictException(
        `Cannot open config ${configId}: status is ${config.status}, not draft`,
      );
    }

    // The randomizer consumes the event lifecycle, it does not drive it: the
    // events module owns `status`, so opening a config requires an event that is
    // already active rather than silently activating one.
    const ev = await this.repository.getEventPackAndStatus(config.eventId);
    if (!ev?.packId) {
      throw new ConflictException({
        message: `Event ${config.eventId} has no pack attached`,
        userMessage:
          'El evento no tiene un pack vinculado. Vuelve a guardar la configuración con un pack.',
      });
    }

    if (ev.status !== 'active') {
      throw new ConflictException({
        message: `Event ${config.eventId} is ${ev.status}, not active`,
        userMessage:
          'El evento todavía no está activo. Actívalo antes de abrir la configuración.',
      });
    }

    // A config with no library ROM cannot go live: the server would have no base
    // ROM to generate from. Migrated configs must re-select a base ROM first.
    if (config.romId == null) {
      throw new ConflictException({
        message: `Config ${configId} has no base ROM selected`,
        userMessage:
          'Selecciona una ROM base de la biblioteca antes de abrir la configuración.',
      });
    }

    // Second clean-ROM gate: by open time the pack MUST have a published
    // version whose emulator ROM is exactly the pinned clean ROM. This also
    // catches versions published after the config was created.
    await this.assertPublishedRomMatchesPack(ev.packId, config.cleanRomSha512, {
      requirePublished: true,
    });

    await this.repository.updateConfig(configId, {
      status: 'open' as RandomizerConfigStatus,
    });

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_OPENED',
      actor: actor || 'system',
    });

    this.logger.debug(`Opened config ${configId} for event ${config.eventId}`);

    return this.getConfig(configId);
  }

  /**
   * Close a config: transitions open → closed, stopping new claims but allowing patching/verify.
   */
  async closeConfig(configId: number, actor?: string): Promise<EnrichedConfig> {
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
   * Publish a config: closed → published, making seeds/settings/logs public.
   * Publishing from open would leak seeds mid-play; from draft it is meaningless.
   */
  async publishConfig(
    configId: number,
    actor?: string,
  ): Promise<EnrichedConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'closed') {
      throw new ConflictException(
        `Cannot publish config ${configId}: status is ${config.status}, not closed`,
      );
    }

    await this.repository.updateConfig(configId, {
      status: 'published' as RandomizerConfigStatus,
    });

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_PUBLISHED',
      actor: actor || 'system',
    });

    this.logger.debug(`Published config ${configId}`);

    return this.getConfig(configId);
  }

  /**
   * Reopen a config: closed → open only. Claims re-mint against the same pinned
   * settings/ROM/jar, so this is invariant-safe. Published configs stay published:
   * their seeds are public, and new claims against revealed seeds would break
   * seal integrity.
   */
  async reopenConfig(
    configId: number,
    actor?: string,
  ): Promise<EnrichedConfig> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'closed') {
      throw new ConflictException(
        `Cannot reopen config ${configId}: status is ${config.status}, not closed`,
      );
    }

    await this.repository.updateConfig(configId, {
      status: 'open' as RandomizerConfigStatus,
    });

    await this.repository.appendAudit({
      configId,
      action: 'CONFIG_REOPENED',
      actor: actor || 'system',
    });

    this.logger.debug(`Reopened config ${configId}`);

    return this.getConfig(configId);
  }

  /**
   * Delete a config: draft-only, and frees the event's pack for another event.
   * Non-draft configs are never deletable — their assignments and sealed logs
   * are competition evidence.
   */
  async deleteConfig(configId: number, actor?: string): Promise<void> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.getConfig(configId);

    if (config.status !== 'draft') {
      throw new ConflictException({
        message: `Cannot delete config ${configId}: status is ${config.status}, not draft`,
        userMessage:
          'Solo se puede eliminar una configuración en borrador. Ciérrala o publícala en su lugar.',
      });
    }

    // Drafts cannot mint claims, so this is belt-and-braces.
    const assignments =
      await this.repository.countAssignmentsByConfig(configId);
    if (assignments > 0) {
      throw new ConflictException(
        `Cannot delete config ${configId}: it has ${assignments} assignment(s)`,
      );
    }

    await this.repository.deleteConfigAndDetachPack(configId, config.eventId);

    // configId null on purpose: the FK target is gone (audit FK is set-null);
    // meta preserves the ids.
    await this.repository.appendAudit({
      configId: null,
      action: 'CONFIG_DELETED',
      actor: actor || 'system',
      meta: { configId, eventId: config.eventId },
    });

    this.logger.debug(
      `Deleted config ${configId} and detached pack from event ${config.eventId}`,
    );
  }
}
