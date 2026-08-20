import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  UseGuards,
  StreamableFile,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  DesktopAuthGuard,
  DesktopRequest,
} from '@api/packs/guards/desktop-auth.guard';
import { Public } from '@api/_utils/decorators/public.decorator';
import { AssignmentsService } from './services/assignments.service';
import { RandomizerPackLinkRepository } from '@api/_repositories/randomizer/pack-link.repository';
import { AssignmentClaimedDto } from './dto/randomizer.dto';
import { RandomizerRepository } from './repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

// Launcher endpoints for randomizer claim and ROM patching.
// Each route is @Public() (per-route, never on the class — a class-level
// @Public would also neuter the guard) so the global JwtAuthGuard lets the
// launcher token through; DesktopAuthGuard then authenticates it. Without the
// @Public the global website guard 401s every launcher call before this guard
// runs — which silently killed all randomizer minting.
@ApiTags('Randomizer | Launcher')
@Controller('randomizer/launcher')
@UseGuards(DesktopAuthGuard)
@ApiBearerAuth('Launcher')
export class RandomizerLauncherController {
  constructor(
    private readonly assignments: AssignmentsService,
    @Inject(RANDOMIZER_REPOSITORY_TOKEN)
    private readonly repository: RandomizerRepository,
    private readonly packLink: RandomizerPackLinkRepository,
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
    @Req() req: DesktopRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.desktopClient) {
      throw new Error('Launcher principal not found');
    }

    // Resolve pack -> active event -> randomizer config, then delegate to the
    // same mint-on-claim path. 404 (no config) leaves the launcher panel
    // hidden; the machine `error` code distinguishes it from other 404s.
    const config = await this.packLink.findByPackId(packId);
    if (!config) {
      throw new NotFoundException({
        error: 'no_event',
        message: `No active randomizer config found for pack ${packId}`,
      });
    }

    return this.assignments.getMyAssignment(config.id, req.desktopClient);
  }

  /**
   * GET /events/:eventId/rom
   *
   * Get the launcher user's randomized ROM. The server generates it on first
   * request (clean library ROM + config settings + assignment seed → FVX), caches
   * the output blob, and streams it. Every later request streams the cache.
   *
   * - Mints the assignment if the config is open and the user is entitled.
   * - `x-output-sha512` header carries the expected hash the launcher pins.
   * - 409 if the config has no base ROM on the server (admin never selected one).
   *
   * Keyed by eventId to keep the launcher contract stable (the sealed assignment
   * DTO exposes eventId, not configId). Resolves event → config internally.
   */
  @Public()
  @Get('events/:eventId/rom')
  @ApiOperation({
    summary: 'Download my randomized ROM (server generates on first request)',
  })
  @ApiResponse({
    status: 200,
    headers: {
      'x-output-sha512': {
        description: 'SHA-512 of the randomized ROM (pin this in the slot).',
        schema: { type: 'string' },
      },
    },
    content: {
      'application/octet-stream': {
        schema: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'No config / not accepting claims' })
  @ApiResponse({ status: 403, description: 'Not registered for this event' })
  @ApiResponse({
    status: 409,
    description: 'Config has no base ROM on the server',
  })
  async getRom(
    @Param('eventId') eventId: string,
    @Req() req: DesktopRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!req.desktopClient) {
      throw new Error('Launcher principal not found');
    }

    const config = await this.repository.getConfigByEventId(Number(eventId));
    if (!config) {
      throw new NotFoundException({
        error: 'no_event',
        message: `No randomizer config found for event ${eventId}`,
      });
    }

    const { stream, outputSha512, contentLength } =
      await this.assignments.getOrGenerateRom(config.id, req.desktopClient);

    // Expose the hash so the launcher can pin the slot's expected hash without
    // re-hashing the whole file, and so browsers/CORS clients can read it.
    res.set('x-output-sha512', outputSha512);
    res.set('Access-Control-Expose-Headers', 'x-output-sha512');

    const ext = config.gamePlatform === 'nds' ? 'nds' : 'gba';
    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="randomized.${ext}"`,
      length: contentLength,
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
  @ApiResponse({
    status: 404,
    description: 'Config not found or not accepting claims',
  })
  @ApiResponse({ status: 403, description: 'Not registered for this event' })
  async getMyAssignment(
    @Param('configId') configId: string,
    @Req() req: DesktopRequest,
  ): Promise<AssignmentClaimedDto> {
    if (!req.desktopClient) {
      throw new Error('Launcher principal not found');
    }

    return this.assignments.getMyAssignment(
      Number(configId),
      req.desktopClient,
    );
  }
}
