import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  StreamableFile,
  NotFoundException,
  BadRequestException,
  PayloadTooLargeException,
  Inject,
} from '@nestjs/common';
import { Readable } from 'stream';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  LauncherAuthGuard,
  LauncherRequest,
} from '@api/packs/guards/launcher-auth.guard';
import { AssignmentsService } from './services/assignments.service';
import { AssignmentClaimedDto } from './dto/randomizer.dto';
import { RandomizerRepository } from './repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Launcher endpoints for randomizer claim and ROM patching.
// All routes require launcher authentication.
@ApiTags('Randomizer | Launcher')
@Controller('randomizer/launcher')
@UseGuards(LauncherAuthGuard)
@ApiBearerAuth('Launcher')
export class RandomizerLauncherController {
  constructor(
    private readonly assignments: AssignmentsService,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
  ) {}

  /**
   * GET /events/:eventId/assignment
   *
   * Get the current launcher user's assignment for an event.
   * Returns sealed DTO (no seed, no log, status only).
   * On first call, binds the launcher's UUID and marks as claimed.
   */
  @Get('events/:eventId/assignment')
  @ApiOperation({ summary: 'Obtener mi asignación en un evento' })
  @ApiResponse({ status: 200, type: AssignmentClaimedDto })
  async getMyAssignment(
    @Param('eventId') eventId: string,
    @Req() req: LauncherRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    return this.assignments.getMyAssignment(Number(eventId), req.launcher);
  }

  /**
   * GET /packs/:packId/my-assignment
   *
   * Get the current launcher user's assignment for a pack's active randomizer event.
   * Resolves the pack to its active event (locked or running status),
   * then returns the user's assignment via claim-on-first-fetch semantics.
   * Returns sealed DTO (no seed, no log, status only).
   *
   * Active event rule: an event is claimable if it has status 'locked' or 'running'
   * (seeds exist). Draft events have no seeds; finished events are closed.
   *
   * Returns 404 if no active event exists for this pack.
   */
  @Get('packs/:packId/my-assignment')
  @ApiOperation({
    summary: 'Obtener mi asignación en un evento aleatorio de un pack',
  })
  @ApiResponse({ status: 200, type: AssignmentClaimedDto })
  @ApiResponse({ status: 404, description: 'No active event found for pack' })
  async getMyAssignmentByPack(
    @Param('packId') packId: string,
    @Req() req: LauncherRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    // Resolve pack to its active event (locked or running status)
    const event = await this.repository.findActiveEventByPackId(packId);
    if (!event) {
      throw new NotFoundException(
        `No active randomizer event found for pack ${packId}`,
      );
    }

    // Delegate to getMyAssignment for claim-on-first-fetch semantics
    return this.assignments.getMyAssignment(event.id, req.launcher);
  }

  /**
   * POST /events/:eventId/rom
   *
   * Upload a clean ROM: hash, verify, randomize, store log, return randomized ROM.
   * - Request body: the clean ROM as a raw application/octet-stream body
   *   (the launcher uploads raw bytes — see apps/launcher/src-tauri/src/randomizer.rs).
   * - Response: streams the randomized ROM back.
   */
  @Post('events/:eventId/rom')
  @ApiOperation({
    summary: 'Subir ROM parcheada y descargar ROM aleatorizada',
  })
  @ApiConsumes('application/octet-stream')
  @ApiResponse({
    status: 200,
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  async patchRom(
    @Param('eventId') eventId: string,
    @Req() req: LauncherRequest,
  ): Promise<StreamableFile> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    // The clean ROM arrives as a raw octet-stream body. express.json() only
    // parses application/json, so req is still an unconsumed Readable here.
    // Buffer it with a hard cap (NDS dumps run ~16–64MB) before patching.
    const MAX_ROM_BYTES = 96 * 1024 * 1024;
    const chunks: Buffer[] = [];
    let total = 0;
    for await (const chunk of req) {
      const buf = chunk as Buffer;
      total += buf.length;
      if (total > MAX_ROM_BYTES) {
        throw new PayloadTooLargeException('ROM upload exceeds the size limit');
      }
      chunks.push(buf);
    }
    const romBuffer = Buffer.concat(chunks);
    if (romBuffer.length === 0) {
      throw new BadRequestException('Empty ROM upload');
    }

    const { randomizedRom } = await this.assignments.patchRom(
      Number(eventId),
      req.launcher,
      Readable.from(romBuffer),
    );

    // Return randomized ROM as file download
    return new StreamableFile(randomizedRom, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="randomized.gba"',
    });
  }
}
