import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
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
   * - Resolve entitlement: mcUuid → boffMediaUsers → event participant (must be registered/confirmed)
   * - Check if assignment exists for (configId, mcUuid)
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

    if (!principal?.uuid) {
      throw new BadRequestException('Launcher principal required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // Check if assignment already exists for this (configId, mcUuid)
    let assignment = await this.repository.getAssignmentByConfigAndMcUuid(
      configId,
      principal.uuid,
    );

    if (assignment) {
      // Already exists — return sealed DTO
      return this.sealAssignmentDto(assignment, config);
    }

    // Assignment doesn't exist. Check if config is open for new claims.
    if (config.status !== 'open') {
      // Config is not open for claims. They have no assignment.
      throw new NotFoundException(
        `Config ${configId} is not accepting new claims (status: ${config.status})`,
      );
    }

    // Resolve entitlement to check if they're registered/confirmed for this event
    const entitlement = await this.repository.resolveEventEntitlement(
      config.eventId,
      principal.uuid,
    );

    if (!entitlement) {
      // Not registered/confirmed for this event
      throw new ForbiddenException(
        'You are not registered or confirmed for this event.',
      );
    }

    // MINT: Generate seed and create assignment
    const seed = randomBytes(6).readUintBE(0, 6) % Number.MAX_SAFE_INTEGER;

    const assignmentId = await this.repository.createAssignment({
      configId,
      boffmediaUserId: entitlement.boffmediaUserId,
      mcUuid: principal.uuid,
      seed,
      status: 'claimed',
      claimedAt: new Date(),
    });

    await this.repository.appendAudit({
      assignmentId,
      action: 'SEED_MINTED',
      actor: principal.uuid,
      meta: { seed },
    });

    this.logger.debug(
      `Minted assignment ${assignmentId} for user ${principal.uuid} with seed ${seed}`,
    );

    // Fetch fresh assignment to return
    const newAssignment = await this.repository.getAssignmentById(assignmentId);
    if (!newAssignment) {
      throw new Error('Failed to retrieve created assignment');
    }

    return this.sealAssignmentDto(newAssignment, config);
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
   * Upload a patched ROM: hash, verify, randomize, store log, update assignment.
   *
   * - Get config and assignment
   * - Hash the incoming stream server-side
   * - 422 if hash != config.cleanRomSha512
   * - Fetch assignment seed and config settings blob
   * - Call runner.randomize
   * - Store log blob
   * - Update assignment: outputSha512, logBlobSha512, patchedAt, status=patched
   * - Audit ROM_RECEIVED then PATCHED
   * - Stream back the randomized ROM
   */
  async patchRom(
    configId: number,
    principal: LauncherPrincipal,
    romStream: Readable,
  ): Promise<{ randomizedRom: Readable; logBlob: Buffer }> {
    if (!configId || configId <= 0) {
      throw new BadRequestException('Valid configId is required');
    }

    const config = await this.repository.getConfigById(configId);
    if (!config) {
      throw new NotFoundException(`Config ${configId} not found`);
    }

    // Get assignment — user must have already claimed
    const assignment = await this.repository.getAssignmentByConfigAndMcUuid(
      configId,
      principal.uuid,
    );

    if (!assignment) {
      throw new NotFoundException(
        `No assignment found for config ${configId} and user ${principal.uuid}`,
      );
    }

    // Hash the incoming ROM stream
    const hash = createHash('sha512');
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      romStream.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        chunks.push(chunk);
      });

      romStream.on('end', async () => {
        try {
          const uploadedSha512 = hash.digest('hex');

          // Verify hash
          if (uploadedSha512 !== config.cleanRomSha512) {
            await this.repository.appendAudit({
              assignmentId: assignment.id,
              action: 'ROM_RECEIVED',
              actor: principal.uuid,
              meta: { uploadedSha512, expectedSha512: config.cleanRomSha512 },
            });

            throw new UnprocessableEntityException({
              message: `ROM hash mismatch: expected ${config.cleanRomSha512}, got ${uploadedSha512}`,
              userMessage:
                'El archivo ROM no coincide con el esperado. Verifica que sea el archivo correcto.',
            });
          }

          // Audit receipt
          await this.repository.appendAudit({
            assignmentId: assignment.id,
            action: 'ROM_RECEIVED',
            actor: principal.uuid,
            meta: { uploadedSha512 },
          });

          // Fetch settings JSON bytes (with heal-on-miss logic)
          const settingsJsonBytes = await this.eventsService.settingsJsonBytesForConfig(config);

          // Encode settings JSON to .rnqs
          const settingsRnqs = await this.settingsShim.encode(
            JSON.parse(settingsJsonBytes.toString('utf-8')),
          );

          const job: RandomizeJob = {
            romStream: Readable.from(chunks),
            settingsRnqs,
            seed: assignment.seed,
            gamePlatform: config.gamePlatform as 'gba' | 'nds',
            jarSha512: config.fvxJarSha512,
          };

          const result = await this.runner.randomize(job);

          // Store log blob
          const { sha512: logBlobSha512 } = await this.blobStorage.storeBlob(
            Readable.from(result.logBytes),
          );

          // Update assignment
          await this.repository.updateAssignment(assignment.id, {
            outputSha512: result.outputSha512,
            logBlobSha512,
            patchedAt: new Date(),
            status: 'patched',
          });

          // Audit patched
          await this.repository.appendAudit({
            assignmentId: assignment.id,
            action: 'PATCHED',
            actor: principal.uuid,
            meta: { outputSha512: result.outputSha512, logBlobSha512 },
          });

          this.logger.debug(
            `Patched assignment ${assignment.id}: output ${result.outputSha512.slice(0, 8)}..., log ${logBlobSha512.slice(0, 8)}...`,
          );

          // Return randomized ROM as stream from actual bytes
          resolve({
            randomizedRom: Readable.from(result.romBytes),
            logBlob: result.logBytes,
          });
        } catch (error) {
          reject(error);
        }
      });

      romStream.on('error', (error) => {
        this.logger.error('ROM stream error:', error);
        reject(
          new BadRequestException({
            message: `ROM upload failed: ${(error as Error).message}`,
            userMessage: 'La subida se ha interrumpido. Inténtalo de nuevo.',
          }),
        );
      });
    });
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

    const assignments = await this.repository.listAssignmentsByConfig(configId);

    return assignments.map(
      (a) =>
        ({
          id: a.id,
          configId: a.configId,
          boffmediaUserId: a.boffmediaUserId,
          mcUuid: a.mcUuid,
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
