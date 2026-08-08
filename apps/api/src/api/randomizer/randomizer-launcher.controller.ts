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
import { Public } from '@api/_utils/decorators/public.decorator';
import { AssignmentsService } from './services/assignments.service';
import { AssignmentClaimedDto } from './dto/randomizer.dto';
import { RandomizerRepository } from './repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Launcher endpoints for randomizer claim and ROM patching.
// Each route is @Public() (per-route, never on the class — a class-level
// @Public would also neuter the guard) so the global JwtAuthGuard lets the
// launcher token through; LauncherAuthGuard then authenticates it. Without the
// @Public the global website guard 401s every launcher call before this guard
// runs — which silently killed all randomizer minting.
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
   * GET /packs/:packId/my-assignment
   *
   * Resolve packId → boffMediaEvent (WHERE packId) → randomizerConfig (WHERE eventId).
   * Then mint-on-claim or return existing assignment.
   *
   * - If no event found with this packId → 404
   * - If no config found for event → 404 (event has no randomizer setup)
   * - If config status not in ('open', 'closed', 'published') → 404 (claims not possible)
   * - If user not registered/confirmed for event → 403 (not eligible)
   * - If no assignment found AND config.status==='open' → MINT seed, create assignment, return sealed DTO
   * - If no assignment found AND config.status!=='open' → 404 (claims closed)
   * - If assignment found → return it (sealed DTO)
   */
  @Public()
  @Get('packs/:packId/my-assignment')
  @ApiOperation({
    summary: 'Get my randomizer assignment for a pack',
    description:
      'Resolves pack to its active randomizer config. Mints seed on first claim if open.',
  })
  @ApiResponse({ status: 200, type: AssignmentClaimedDto })
  @ApiResponse({ status: 404, description: 'No active config found for pack' })
  @ApiResponse({ status: 403, description: 'Not registered for this event' })
  async getMyAssignmentByPack(
    @Param('packId') packId: string,
    @Req() req: LauncherRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    // Resolve pack -> active event -> randomizer config, then delegate to the
    // same mint-on-claim path. 404 (no config) leaves the launcher panel hidden.
    const config = await this.repository.getConfigByPackId(packId);
    if (!config) {
      throw new NotFoundException(
        `No active randomizer config found for pack ${packId}`,
      );
    }

    return this.assignments.getMyAssignment(config.id, req.launcher);
  }

  /**
   * POST /events/:eventId/rom
   *
   * Upload a clean ROM: hash, verify, randomize, store log, return randomized ROM.
   * - Request body: the clean ROM as a raw application/octet-stream body
   * - Response: streams the randomized ROM back.
   *
   * Keyed by eventId to keep the launcher contract stable (the sealed assignment
   * DTO exposes eventId, not configId). Resolves event -> config internally.
   */
  @Public()
  @Post('events/:eventId/rom')
  @ApiOperation({
    summary: 'Upload clean ROM and receive randomized ROM',
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

    const config = await this.repository.getConfigByEventId(Number(eventId));
    if (!config) {
      throw new NotFoundException(
        `No randomizer config found for event ${eventId}`,
      );
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
      config.id,
      req.launcher,
      Readable.from(romBuffer),
    );

    // Return randomized ROM as file download
    return new StreamableFile(randomizedRom, {
      type: 'application/octet-stream',
      disposition: 'attachment; filename="randomized.gba"',
    });
  }

  /**
   * GET /configs/:configId/my-assignment
   *
   * Get the current launcher user's assignment for a config.
   * Mint-on-claim or return existing.
   *
   * Returns sealed DTO (no seed, no log, status only).
   */
  @Public()
  @Get('configs/:configId/my-assignment')
  @ApiOperation({
    summary: 'Get my randomizer assignment for a config',
    description: 'Mints seed on first claim if config is open.',
  })
  @ApiResponse({ status: 200, type: AssignmentClaimedDto })
  @ApiResponse({ status: 404, description: 'Config not found or not accepting claims' })
  @ApiResponse({ status: 403, description: 'Not registered for this event' })
  async getMyAssignment(
    @Param('configId') configId: string,
    @Req() req: LauncherRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.launcher) {
      throw new Error('Launcher principal not found');
    }

    return this.assignments.getMyAssignment(Number(configId), req.launcher);
  }
}
