import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { Readable } from 'stream';
import { Logger } from 'nestjs-pino';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import type { LauncherPrincipal } from '@api/packs/types/packs.types';
import {
  AssignmentClaimedDto,
  AssignmentAdminDto,
} from '../dto/randomizer.dto';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import {
  RANDOMIZER_RUNNER_TOKEN,
  type IRandomizerRunner,
  type RandomizeJob,
} from '../ports/randomizer-runner.port';
import {
  SETTINGS_SHIM_TOKEN,
  type ISettingsShim,
} from '../ports/settings-shim.port';
import {
  RandomizerAssignmentStatus,
  RandomizerConfigStatus,
  type RandomizerAssignment,
  type RandomizerConfig,
} from '@/_db/schema/Randomizer';
import { EventsService } from './events.service';

@Injectable()
export class AssignmentsService {
  /**
   * Per-assignment single-flight lock for ROM generation. A double GET (e.g. the
   * launcher retrying) never triggers two FVX runs for the same assignment — the
   * second request awaits the first's stored output.
   */
  private readonly inFlight = new Map<number, Promise<{ outputSha512: string }>>();

  constructor(
    private readonly logger: Logger,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    private readonly blobStorage: PacksDownloadsService,
    @Inject(RANDOMIZER_RUNNER_TOKEN)
    private readonly runner: IRandomizerRunner,
    @Inject(SETTINGS_SHIM_TOKEN)
    private readonly settingsShim: ISettingsShim,
    private readonly eventsService: EventsService,
  ) {}

  /**
   * Get the current user's assignment for a config.
   *
   * - Resolve entitlement by user id: event participant must be registered/confirmed
   * - Check if assignment exists for (configId, userId)
   * - If found → return it (sealed DTO)
   * - If NOT found AND config.status==='open' → MINT: generate seed, create assignment, return sealed DTO
   * - If NOT found AND config.status!=='open' → throw 404 (claims closed; they never participated)
   *
   * NEVER expose seed in the sealed DTO.
   */
  async getMyAssignment(
    configId: number,
    principal: LauncherPrincipal,
  ): Promise<AssignmentClaimedDto> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException({
        error: 'not_found',
        message: `Config ${configId} not found`,
      });
    }

    const assignment = await this.resolveOrMintAssignment(config, principal);
    return this.sealAssignmentDto(assignment, config);
  }

  /**
   * Resolve the launcher user's assignment for a config, minting on first claim.
   *
   * - Existing assignment → return it.
   * - No assignment AND config.status==='open' AND user entitled → MINT (seed + row).
   * - No assignment AND config not open → 404 (claims closed; they never participated).
   * - No assignment AND not entitled → 403.
   *
   * Shared by the sealed-DTO claim path and the ROM generation path so both mint
   * identically. Returns the raw assignment row (NEVER expose its seed to players).
   */
  private async resolveOrMintAssignment(
    config: RandomizerConfig,
    principal: LauncherPrincipal,
  ): Promise<RandomizerAssignment> {
    if (!principal?.userId) {
      throw new BadRequestException('Launcher principal required');
    }

    await this.assertConfigRomConsistent(config);

    // Entitlement is re-checked on EVERY call, not just on mint: a participant
    // removed from the event keeps their assignment row but loses access.
    const entitlement = await this.repository.resolveEventEntitlement(
      config.eventId,
      principal.userId,
    );

    const assignment = await this.repository.getAssignmentByConfigAndUser(
      config.id,
      principal.userId,
    );
    if (assignment) {
      if (!entitlement) {
        throw new ForbiddenException(
          'You are no longer registered or confirmed for this event.',
        );
      }
      return assignment;
    }

    if (config.status !== 'open') {
      throw new NotFoundException({
        error: 'claims_closed',
        message: `Config ${config.id} is not accepting new claims (status: ${config.status})`,
      });
    }

    if (!entitlement) {
      throw new ForbiddenException(
        'You are not registered or confirmed for this event.',
      );
    }

    const seed = randomBytes(6).readUintBE(0, 6);

    let assignmentId: number;
    try {
      assignmentId = await this.repository.createAssignment({
        configId: config.id,
        boffmediaUserId: entitlement.boffmediaUserId,
        mcUuid: principal.mcUuid ?? null,
        seed,
        status: 'claimed',
        claimedAt: new Date(),
      });
    } catch (error) {
      // Concurrent mint (unique rass_config_user): serve the winner's row
      // instead of surfacing a duplicate-key 500.
      const winner = await this.repository.getAssignmentByConfigAndUser(
        config.id,
        principal.userId,
      );
      if (winner) {
        return winner;
      }
      throw error;
    }

    await this.repository.appendAudit({
      assignmentId,
      action: 'SEED_MINTED',
      actor: String(principal.userId),
      meta: { seed },
    });

    this.logger.debug(
      `Minted assignment ${assignmentId} for user ${principal.userId} with seed ${seed}`,
    );

    const newAssignment = await this.repository.getAssignmentById(assignmentId);
    if (!newAssignment) {
      throw new Error('Failed to retrieve created assignment');
    }
    return newAssignment;
  }

  /**
   * Claim-time half of the clean-ROM gate: if the pack currently linked to the
   * config's event ships a published emulator ROM whose hash differs from the
   * pinned clean ROM, the launcher's anti-cheat comparison is disarmed — refuse
   * to serve assignments/ROMs until an admin fixes the pack or the config.
   * (Publish lives in the packs module, so this is the in-scope re-assert for
   * versions published mid-event.)
   */
  private async assertConfigRomConsistent(
    config: RandomizerConfig,
  ): Promise<void> {
    const ev = await this.repository.getEventPackAndStatus(config.eventId);
    if (!ev?.packId) return;
    const pub = await this.repository.getPublishedEmulatorRom(ev.packId);
    if (pub?.state === 'ok' && pub.sha512 !== config.cleanRomSha512) {
      throw new ConflictException({
        message: `Config ${config.id}: pack ${ev.packId} publishes emulator ROM ${pub.sha512.slice(0, 8)}… but the config pins clean ROM ${config.cleanRomSha512.slice(0, 8)}…`,
        userMessage:
          'La ROM del pack publicado no coincide con la configurada para este evento. Avisa a un administrador.',
      });
    }
  }

  /**
   * Create a sealed assignment DTO (NEVER includes seed).
   */
  private sealAssignmentDto(
    assignment: RandomizerAssignment,
    config: RandomizerConfig,
  ): AssignmentClaimedDto {
    return {
      eventId: String(config.eventId),
      status: assignment.status as RandomizerAssignmentStatus,
      gamePlatform: config.gamePlatform,
      gameTitle: config.gameTitle,
      cleanRomSha512: config.cleanRomSha512,
      romHint: config.romHint,
      configStatus: config.status as RandomizerConfigStatus,
      outputSha512: assignment.outputSha512,
    };
  }

  /**
   * Get the launcher user's randomized ROM for a config, generating it server-side
   * on first request and caching the output blob thereafter.
   *
   * - Resolve/mint the assignment (same entitlement + open-config rules as claim).
   * - Cached: assignment.outputSha512 set and its blob on disk → stream it (ROM_SERVED).
   * - Generate: stream the clean ROM from the blob store (409 if the config has no
   *   base ROM on the server) + encoded settings + assignment seed → runner.randomize
   *   → store output + log blobs → assignment {outputSha512, logBlobSha512, patchedAt,
   *   status:'patched'} → ROM_GENERATED → stream.
   * - Concurrency: a per-assignment in-flight lock prevents a double request from
   *   randomizing twice.
   *
   * The output blob is content-addressed by its sha512 (== outputSha512), so both
   * the generator and any concurrent waiter stream it back through the blob store.
   */
  async getOrGenerateRom(
    configId: number,
    principal: LauncherPrincipal,
  ): Promise<{ stream: Readable; outputSha512: string; contentLength: number }> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException({
        error: 'not_found',
        message: `Config ${configId} not found`,
      });
    }

    const assignment = await this.resolveOrMintAssignment(config, principal);

    // Cached fast-path: output already generated and still on disk.
    if (assignment.outputSha512) {
      const size = await this.blobStorage.blobSize(assignment.outputSha512);
      if (size !== null) {
        await this.repository.appendAudit({
          assignmentId: assignment.id,
          action: 'ROM_SERVED',
          actor: String(principal.userId),
          meta: { outputSha512: assignment.outputSha512 },
        });
        return this.streamOutput(assignment.outputSha512);
      }
    }

    // Generate (or join an in-flight generation) for this assignment.
    let generation = this.inFlight.get(assignment.id);
    if (!generation) {
      generation = this.generateRom(config, assignment, principal).finally(() => {
        this.inFlight.delete(assignment.id);
      });
      this.inFlight.set(assignment.id, generation);
    }
    const { outputSha512 } = await generation;
    return this.streamOutput(outputSha512);
  }

  /** Open a read stream over a stored output blob (with its content length). */
  private async streamOutput(
    outputSha512: string,
  ): Promise<{ stream: Readable; outputSha512: string; contentLength: number }> {
    const { stream, contentLength } = await this.blobStorage.override(
      outputSha512,
    );
    // Blob is always on disk here (checked before calling), so length is real.
    return { stream, outputSha512, contentLength: contentLength ?? 0 };
  }

  /**
   * Run FVX against the config's clean ROM (from the blob store) with the
   * assignment's seed, store the output + log blobs, and mark the assignment
   * patched. Returns the output sha512 (the stored blob's content address).
   */
  private async generateRom(
    config: RandomizerConfig,
    assignment: RandomizerAssignment,
    principal: LauncherPrincipal,
  ): Promise<{ outputSha512: string }> {
    // The clean ROM must be on the server (uploaded to the library and pinned).
    // A missing blob is an admin-side error (config never got a base ROM), kept
    // distinct from the player-side 404/403 above.
    const cleanSize = await this.blobStorage.blobSize(config.cleanRomSha512);
    if (cleanSize === null) {
      throw new ConflictException({
        message: `Config ${config.id} has no base ROM on the server (clean blob ${config.cleanRomSha512.slice(0, 8)}… missing)`,
        userMessage:
          'Este evento todavía no tiene una ROM base en el servidor. Avisa a un administrador.',
      });
    }

    const { stream: cleanStream } = await this.blobStorage.override(
      config.cleanRomSha512,
    );

    // Settings JSON bytes (heal-on-miss) → .rnqs
    const settingsJsonBytes =
      await this.eventsService.settingsJsonBytesForConfig(config);
    const settingsRnqs = await this.settingsShim.encode(
      JSON.parse(settingsJsonBytes.toString('utf-8')),
    );

    const job: RandomizeJob = {
      romStream: cleanStream,
      settingsRnqs,
      seed: assignment.seed,
      gamePlatform: config.gamePlatform as 'gba' | 'nds',
      jarSha512: config.fvxJarSha512,
    };

    const result = await this.runner.randomize(job);

    // Cache the randomized ROM (content-addressed → key === outputSha512) and the log.
    const { sha512: storedRomSha512 } = await this.blobStorage.storeBlob(
      Readable.from(result.romBytes),
    );
    // outputSha512 is pinned into the launcher marker AND used as the blob
    // address, so a divergence here would 404 every later download.
    if (storedRomSha512 !== result.outputSha512) {
      this.logger.error(
        `Assignment ${assignment.id}: stored ROM blob hash ${storedRomSha512} != runner outputSha512 ${result.outputSha512}`,
      );
      throw new Error(
        `Randomized ROM hash mismatch: runner reported ${result.outputSha512.slice(0, 8)}… but blob store computed ${storedRomSha512.slice(0, 8)}…`,
      );
    }
    const { sha512: logBlobSha512 } = await this.blobStorage.storeBlob(
      Readable.from(result.logBytes),
    );

    await this.repository.updateAssignment(assignment.id, {
      outputSha512: result.outputSha512,
      logBlobSha512,
      patchedAt: new Date(),
      status: 'patched',
    });

    await this.repository.appendAudit({
      assignmentId: assignment.id,
      action: 'ROM_GENERATED',
      actor: String(principal.userId),
      meta: { outputSha512: result.outputSha512, logBlobSha512 },
    });

    this.logger.debug(
      `Generated ROM for assignment ${assignment.id}: output ${result.outputSha512.slice(0, 8)}…, log ${logBlobSha512.slice(0, 8)}…`,
    );

    return { outputSha512: result.outputSha512 };
  }

  /**
   * List all assignments for a config (admin only).
   * Seed is ONLY included if config.status === 'published'.
   */
  async listAssignmentsForAdmin(
    configId: number,
  ): Promise<AssignmentAdminDto[]> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // The name-joining variant, not the bare one: the admin table's first
    // column is the participant, and without the username join it can only show
    // an opaque user id — which the web panel rendered as a blank cell.
    const assignments =
      await this.repository.listAssignmentsByConfigWithDisplayNames(configId);

    // Seeds are exposed only once results go public; until then they are under
    // seal, which is what the table's lock column reports.
    const sealed = config.status !== 'published';

    return assignments.map(
      (a) =>
        ({
          id: a.id,
          configId: a.configId,
          boffmediaUserId: a.boffmediaUserId,
          displayName: a.displayName,
          mcUuid: a.mcUuid,
          seedSealed: sealed,
          ...(config.status === 'published' && { seed: a.seed }), // Only expose seed when published
          status: a.status,
          outputSha512: a.outputSha512,
          logBlobSha512: a.logBlobSha512,
          claimedAt: a.claimedAt,
          patchedAt: a.patchedAt,
          verifiedAt: a.verifiedAt,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
        }) as AssignmentAdminDto,
    );
  }

  /**
   * Read a sealed spoiler log blob (judge/admin view).
   * The log is stored as a sealed blob on disk; this retrieves and streams it.
   */
  async getAssignmentLog(
    configId: number,
    assignmentId: number,
  ): Promise<Buffer> {
    if (!configId || configId <= 0 || !assignmentId || assignmentId <= 0) {
      throw new BadRequestException('Valid configId and assignmentId required');
    }

    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (!assignment || assignment.configId !== configId) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for config ${configId}`,
      );
    }

    if (!assignment.logBlobSha512) {
      throw new NotFoundException(
        `No spoiler log found for assignment ${assignmentId}`,
      );
    }

    // Fetch log blob from disk
    const { stream } = await this.blobStorage.override(
      assignment.logBlobSha512,
    );

    // Read stream into buffer
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        this.logger.error('Failed to read log blob:', error);
        reject(
          new NotFoundException({
            message: `Could not read log blob ${assignment.logBlobSha512}`,
            userMessage: 'No se ha podido acceder al registro de ese jugador.',
          }),
        );
      });
    });
  }

  /**
   * PUBLIC: List all assignments for a config with user display names.
   * Seed is ONLY exposed when config.status === 'published'.
   * Enforced at service layer for defense-in-depth.
   */
  async listAssignmentsForPublic(
    configId: number,
  ): Promise<any[]> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    const assignmentsWithNames =
      await this.repository.listAssignmentsByConfigWithDisplayNames(configId);

    return assignmentsWithNames.map(
      (a) =>
        ({
          id: a.id,
          configId: a.configId,
          displayName: a.displayName,
          status: a.status,
          outputSha512: a.outputSha512,
          claimedAt: a.claimedAt,
          patchedAt: a.patchedAt,
          verifiedAt: a.verifiedAt,
          createdAt: a.createdAt,
          // Only expose seed when config is published
          ...(config.status === 'published' && { seed: a.seed }),
        }) as any,
    );
  }

  /**
   * PUBLIC: Get config settings blob (download).
   * ONLY available when config.status === 'published'.
   * Enforced at service layer.
   */
  async getConfigSettingsBlob(configId: number): Promise<Buffer> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // Gate on published status
    if (config.status !== 'published') {
      throw new ForbiddenException(
        'Settings are only available after the config is published.',
      );
    }

    if (!config.settingsBlobSha512) {
      throw new NotFoundException(`No settings blob found for config ${configId}`);
    }

    // Fetch settings blob from disk
    const { stream } = await this.blobStorage.override(
      config.settingsBlobSha512,
    );

    // Read stream into buffer
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        this.logger.error('Failed to read settings blob:', error);
        reject(
          new NotFoundException({
            message: `Could not read settings blob ${config.settingsBlobSha512}`,
            userMessage:
              'No se ha podido acceder a los ajustes de la configuración.',
          }),
        );
      });
    });
  }

  /**
   * PUBLIC: Get assignment log (download).
   * ONLY available when config.status === 'published'.
   * Enforced at service layer.
   */
  async getPublicAssignmentLog(
    configId: number,
    assignmentId: number,
  ): Promise<Buffer> {
    if (!configId || configId <= 0 || !assignmentId || assignmentId <= 0) {
      throw new BadRequestException('Valid configId and assignmentId required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // Gate on published status
    if (config.status !== 'published') {
      throw new ForbiddenException(
        'Logs are only available after the config is published.',
      );
    }

    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (!assignment || assignment.configId !== configId) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for config ${configId}`,
      );
    }

    if (!assignment.logBlobSha512) {
      throw new NotFoundException(
        `No log found for assignment ${assignmentId}`,
      );
    }

    // Fetch log blob from disk
    const { stream } = await this.blobStorage.override(
      assignment.logBlobSha512,
    );

    // Read stream into buffer
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', (error) => {
        this.logger.error('Failed to read public log blob:', error);
        reject(
          new NotFoundException({
            message: `Could not read log blob ${assignment.logBlobSha512}`,
            userMessage: 'No se ha podido acceder al registro de ese jugador.',
          }),
        );
      });
    });
  }
}
