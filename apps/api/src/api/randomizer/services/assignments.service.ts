import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
  ForbiddenException,
} from '@nestjs/common';
import { createHash } from 'crypto';
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
  RandomizerAssignmentStatus,
  RandomizerEventStatus,
  type RandomizerAssignment,
  type RandomizerEvent,
} from '@/_db/schema/Randomizer';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly logger: Logger,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    private readonly blobStorage: PacksDownloadsService,
    @Inject(RANDOMIZER_RUNNER_TOKEN)
    private readonly runner: IRandomizerRunner,
  ) {}

  /**
   * Resolve an assignment for a launcher user via dual lookup paths.
   *
   * Resolution order:
   *   a. Fast path: by mcUuid (already bound) — return immediately if found
   *   b. Resolve participantId via identity chain (mcUuid → boffMediaUsers → participant)
   *      If null → return null (not eligible / not a participant)
   *   c. Look up assignment by (eventId, participantId)
   *      If found AND mcUuid is null → it's this user's; return it (ready to bind on claim)
   *      If found AND mcUuid is non-null and DIFFERENT from principal.uuid → throw ForbiddenException (claimed by another account)
   *      If found AND mcUuid === principal.uuid → return it (already bound)
   *      If not found → return null
   */
  private async resolveAssignment(
    event: RandomizerEvent,
    principal: LauncherPrincipal,
  ): Promise<RandomizerAssignment | null> {
    // Fast path: look up by mcUuid (already bound)
    let assignment = await this.repository.getAssignmentByMcUuid(
      event.id,
      principal.uuid,
    );
    if (assignment) {
      return assignment;
    }

    // Resolve participantId via identity chain
    const participantId = await this.repository.resolveParticipantId(
      event.tournamentId,
      principal.uuid,
    );
    if (participantId === null) {
      // User is not linked to a boffmedia account or not a participant in this tournament
      return null;
    }

    // Look up assignment by participantId
    assignment = await this.repository.getAssignment(event.id, participantId);
    if (!assignment) {
      return null;
    }

    // Validation: check mcUuid binding state
    if (assignment.mcUuid === null) {
      // Unbound assignment — this user can claim it
      return assignment;
    }

    if (assignment.mcUuid !== principal.uuid) {
      // Foreign claim: someone else already claimed this participant's slot
      throw new ForbiddenException(
        'Esta asignación ya fue reclamada por otra cuenta.',
      );
    }

    // mcUuid === principal.uuid: already bound to this user
    return assignment;
  }

  /**
   * Get the current user's assignment for an event.
   *
   * - Resolve identity: mcUuid → assignment (via dual lookup paths)
   * - On first claim: bind mcUuid, set status=claimed, audit CLAIMED
   * - Return sealed DTO (no seed ever exposed to launcher)
   */
  async getMyAssignment(
    eventId: number,
    principal: LauncherPrincipal,
  ): Promise<AssignmentClaimedDto> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    if (!principal?.uuid) {
      throw new BadRequestException('Launcher principal required');
    }

    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // Resolve assignment via dual lookup paths (mcUuid fast path + identity chain)
    let assignment = await this.resolveAssignment(event, principal);

    if (!assignment) {
      throw new NotFoundException(
        `No assignment found for event ${eventId} and user ${principal.uuid}`,
      );
    }

    // On first claim (or whenever mcUuid is null), bind mcUuid and mark as claimed
    if (assignment.mcUuid === null) {
      await this.repository.updateAssignment(assignment.id, {
        mcUuid: principal.uuid,
        status: 'claimed',
        claimedAt: new Date(),
      });

      await this.repository.appendAudit({
        assignmentId: assignment.id,
        action: 'CLAIMED',
        actor: principal.uuid,
      });

      this.logger.debug(
        `Claimed assignment ${assignment.id} for user ${principal.uuid}`,
      );

      // Refresh to get updated state
      assignment =
        (await this.repository.getAssignmentByMcUuid(
          eventId,
          principal.uuid,
        )) || assignment;
    }

    // Return sealed DTO (NEVER include seed)
    return {
      eventId: event.id,
      status: assignment.status as RandomizerAssignmentStatus,
      gamePlatform: event.gamePlatform,
      gameTitle: event.gameTitle,
      cleanRomSha512: event.cleanRomSha512,
      romHint: event.romHint,
      eventStatus: event.status as RandomizerEventStatus,
      outputSha512: assignment.outputSha512,
    };
  }

  /**
   * Upload a patched ROM: hash, verify, randomize, store log, update assignment.
   *
   * - Resolve assignment via dual lookup paths
   * - Bind mcUuid if not already bound (sets status=claimed if unbound)
   * - Hash the incoming stream server-side
   * - 422 if hash != event.cleanRomSha512
   * - Fetch assignment seed and event settings blob
   * - Call runner.randomize
   * - Store log blob
   * - Update assignment: outputSha512, logBlobSha512, patchedAt, status=patched
   * - Audit ROM_RECEIVED then PATCHED
   * - Stream back the randomized ROM
   */
  async patchRom(
    eventId: number,
    principal: LauncherPrincipal,
    romStream: Readable,
  ): Promise<{ randomizedRom: Readable; logBlob: Buffer }> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    // Resolve assignment via dual lookup paths
    let assignment = await this.resolveAssignment(event, principal);
    if (!assignment) {
      throw new NotFoundException(
        `No assignment found for event ${eventId} and user ${principal.uuid}`,
      );
    }

    // Bind mcUuid if not already bound (sets status=claimed if unbound)
    if (assignment.mcUuid === null) {
      await this.repository.updateAssignment(assignment.id, {
        mcUuid: principal.uuid,
        status: 'claimed',
        claimedAt: new Date(),
      });

      await this.repository.appendAudit({
        assignmentId: assignment.id,
        action: 'CLAIMED',
        actor: principal.uuid,
      });

      this.logger.debug(
        `Claimed assignment ${assignment.id} for user ${principal.uuid}`,
      );

      // Refresh to get updated state
      assignment =
        (await this.repository.getAssignmentByMcUuid(
          eventId,
          principal.uuid,
        )) || assignment;
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
          if (uploadedSha512 !== event.cleanRomSha512) {
            await this.repository.appendAudit({
              assignmentId: assignment.id,
              action: 'ROM_RECEIVED',
              actor: principal.uuid,
              meta: { uploadedSha512, expectedSha512: event.cleanRomSha512 },
            });

            throw new UnprocessableEntityException({
              message: `ROM hash mismatch: expected ${event.cleanRomSha512}, got ${uploadedSha512}`,
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

          // Fetch settings blob from disk via PacksDownloadsService.override()
          if (!event.settingsBlobSha512) {
            throw new Error(
              `Event ${eventId} has no settings blob SHA512 — event is not ready for randomization`,
            );
          }

          let settingsRnqs: Buffer;
          try {
            const { stream: settingsStream } = await this.blobStorage.override(
              event.settingsBlobSha512,
            );
            const settingsChunks: Buffer[] = [];

            await new Promise<void>((resolve, reject) => {
              settingsStream.on('data', (chunk: Buffer) => {
                settingsChunks.push(chunk);
              });
              settingsStream.on('end', () => {
                resolve();
              });
              settingsStream.on('error', (err) => {
                reject(err);
              });
            });

            settingsRnqs = Buffer.concat(settingsChunks);
          } catch (err) {
            throw new Error(
              `Failed to fetch settings blob ${event.settingsBlobSha512}: ${(err as Error).message}`,
            );
          }

          const job: RandomizeJob = {
            romStream: Readable.from(chunks),
            settingsRnqs,
            seed: assignment.seed,
            gamePlatform: event.gamePlatform as 'gba' | 'nds',
            jarSha512: event.fvxJarSha512,
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
   * List all assignments for an event (admin only).
   * Seed is ONLY included if event.status === 'finished'.
   */
  async listAssignmentsForAdmin(
    eventId: number,
  ): Promise<AssignmentAdminDto[]> {
    if (!eventId || eventId <= 0) {
      throw new BadRequestException('Valid eventId is required');
    }

    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }

    const assignments = await this.repository.listAssignmentsByEvent(eventId);

    return assignments.map(
      (a) =>
        ({
          id: a.id,
          eventId: a.eventId,
          participantId: a.participantId,
          mcUuid: a.mcUuid,
          ...(event.status === 'finished' && { seed: a.seed }), // Only expose seed when finished
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
   * Read a sealed spoiler log blob (judge view).
   * The log is stored as a sealed blob on disk; this retrieves and streams it.
   */
  async getAssignmentLog(
    eventId: number,
    assignmentId: number,
  ): Promise<Buffer> {
    if (!eventId || eventId <= 0 || !assignmentId || assignmentId <= 0) {
      throw new BadRequestException('Valid eventId and assignmentId required');
    }

    const assignment = await this.repository.getAssignmentById(assignmentId);
    if (!assignment || assignment.eventId !== eventId) {
      throw new NotFoundException(
        `Assignment ${assignmentId} not found for event ${eventId}`,
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
}
