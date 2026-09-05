import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { DesktopOrUserAuthGuard } from '@api/packs/guards/desktop-or-user-auth.guard';
import { CurrentUser } from '@api/_utils/decorators/current-user.decorator';
import { Public } from '@api/_utils/decorators/public.decorator';
import type { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { BattleTicketService } from './battle-ticket.service';
import { BattlesimRepository } from './battlesim.repository';
import { BattlesimReplayUploadDto } from './dto/battlesim-replay-upload.dto';
import { BattlesimTeamUploadDto } from './dto/battlesim-team-upload.dto';
import { BattlesimListQueryDto } from './dto/list-query.dto';
import { BattlesimTicketDto } from './dto/ws-ticket-response.dto';
import { BattlesimReplayDto } from './dto/replay-response.dto';
import { BattlesimLeagueReplayDto } from './dto/league-replay-response.dto';
import { ReplayService as LeagueReplayService } from '@api/smartrotom/liga/services/replay.service';
import { BattlesimTeamDto } from './dto/team-response.dto';
import { BattlesimPageDto } from './dto/paginated-response.dto';
import { CLIENT, Clients } from '@api/_utils/decorators/clients.decorator';

/**
 * Battlesim endpoints: replay and team storage for local and PvP battles.
 *
 * The controller is thin: it reads from the request, calls the repository for
 * database work, and returns responses. All business logic (validation, ownership)
 * is handled by the guards and the repository.
 */
@ApiTags('BoffMedia 🛠 | Battle Simulator')
@Controller('battlesimulator')
export class BattlesimController {
  constructor(
    private readonly ticketService: BattleTicketService,
    private readonly repo: BattlesimRepository,
    // League replays are Liga's data, but the battle simulator owns the route
    // that serves them to its own viewer (audit B14). BattleModule must import
    // LigaModule for this to resolve — it compiles either way and fails at boot.
    private readonly leagueReplays: LeagueReplayService,
  ) {}

  /**
   * POST /battlesimulator/ws-ticket
   * Mint a short-lived ticket for WebSocket authentication.
   */
  @Post('ws-ticket')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Mint a WebSocket ticket',
    description:
      'Returns a short-lived JWT ticket (60 seconds) for opening a battle socket. ' +
      'Required for both local and PvP battles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Ticket issued',
    type: BattlesimTicketDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized (not logged in or invalid app session)',
  })
  wsTicket(@CurrentUser() user: AuthPrincipal): BattlesimTicketDto {
    return this.ticketService.issue({
      userId: user.userId,
      name: user.username || `Player ${user.userId}`,
    });
  }

  /**
   * GET /battlesimulator/replays?limit=20&cursor=...
   * List caller's replays (local uploads + PvP where they played), newest first.
   * Excludes tombstones.
   */
  @Get('replays')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: "List caller's replays",
    description:
      'Newest first, excluding deleted replays. Includes replays where the caller is an opponent in a PvP battle.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Pagination cursor (encoded timestamp)',
  })
  @ApiResponse({
    status: 200,
    description: 'Replays fetched',
    type: BattlesimPageDto<BattlesimReplayDto>,
  })
  async listReplays(
    @CurrentUser() user: AuthPrincipal,
    @Query() query: BattlesimListQueryDto,
  ): Promise<BattlesimPageDto<BattlesimReplayDto>> {
    const limit = Math.min(query.limit || 20, 100); // Cap at 100
    const { items, cursor } = await this.repo.listReplays(
      user.userId,
      limit,
      query.cursor,
    );
    return { items: items as BattlesimReplayDto[], cursor };
  }

  /**
   * PUT /battlesimulator/replays/:clientId
   * Idempotent upsert of a replay. Dedupes on (user_id, client_id).
   * Validates log size (~8 MB limit for MEDIUMTEXT).
   */
  @Put('replays/:clientId')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth('JWT')
  @ApiParam({
    name: 'clientId',
    description: 'Client-generated replay id',
  })
  @ApiOperation({
    summary: 'Upload or update a replay',
    description:
      'Idempotent upload. If a replay with the same (user, clientId) exists, it is updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Replay uploaded or updated',
    type: BattlesimReplayDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (e.g., log too large)',
  })
  async upsertReplay(
    @CurrentUser() user: AuthPrincipal,
    @Param('clientId') clientId: string,
    @Body() dto: BattlesimReplayUploadDto,
  ): Promise<BattlesimReplayDto> {
    // Validate that the clientId in the URL matches the DTO.
    if (dto.clientId !== clientId) {
      throw new BadRequestException('clientId mismatch between URL and body');
    }

    // Validate log size: MEDIUMTEXT is ~16 MB, but we use ~8 MB as a safety margin.
    // A log is the entire protocol transcript, roughly 1 KB per turn.
    const MAX_LOG_SIZE_BYTES = 8 * 1024 * 1024; // 8 MB
    if (Buffer.byteLength(dto.log, 'utf8') > MAX_LOG_SIZE_BYTES) {
      throw new BadRequestException(
        'Battle log exceeds maximum size (~8 MB). Very long battles may need to be split.',
      );
    }

    const replay = await this.repo.upsertReplay(user.userId, {
      clientId: dto.clientId,
      format: dto.format,
      p1Name: dto.p1Name,
      p2Name: dto.p2Name,
      winner: dto.winner,
      log: dto.log,
      teams: dto.teams,
      source: dto.source,
      playedAt: dto.playedAt,
    });

    return replay as BattlesimReplayDto;
  }

  /**
   * GET /battlesimulator/replays/:id
   * Fetch a single replay by id. Public endpoint (share links).
   * Returns 404 if not found or tombstoned.
   */
  @Get('replays/:id')
  @Public()
  @ApiParam({
    name: 'id',
    description: 'Replay UUID',
  })
  @ApiOperation({
    summary: 'Fetch a replay by id',
    description:
      'Public endpoint for share links. Returns 404 if not found or deleted.',
  })
  @ApiResponse({
    status: 200,
    description: 'Replay found',
    type: BattlesimReplayDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Replay not found',
  })
  async getReplay(@Param('id') id: string): Promise<BattlesimReplayDto> {
    const replay = await this.repo.getReplayById(id);
    if (!replay) {
      throw new NotFoundException('Replay not found');
    }
    return replay as BattlesimReplayDto;
  }

  /**
   * GET /battlesimulator/replays/liga/:id
   * Fetch a league-sourced replay by its integer id. Public (share links).
   *
   * Audit B14. The battlesim replay viewer used to call
   * `/smartrotom/liga/replay/:id` directly, so a battle-simulator screen
   * depended on a SmartRotom module. The row is still Liga's — this delegates
   * to `ReplayService` rather than reaching into its tables — but the HTTP
   * surface the simulator reads now belongs to the simulator.
   *
   * Three segments, so this cannot collide with the two-segment
   * `replays/:id` above regardless of declaration order.
   *
   * Liga's own route answers a non-numeric id with a 500, because its service
   * signals absence by throwing a bare `Error`. This one uses the non-throwing
   * `findReplayById` and answers 400 or 404, which is what a share link that
   * has been mistyped or has expired should say.
   */
  @Get('replays/liga/:id')
  @Public()
  @ApiParam({
    name: 'id',
    description: 'League replay id (positive integer)',
  })
  @ApiOperation({
    summary: 'Fetch a league-sourced replay by id',
    description:
      'Public endpoint for share links into the battlesim replay viewer. Returns 404 if no such league replay exists.',
  })
  @ApiResponse({
    status: 200,
    description: 'Replay found',
    type: BattlesimLeagueReplayDto,
  })
  @ApiResponse({ status: 400, description: 'Malformed replay id' })
  @ApiResponse({ status: 404, description: 'Replay not found' })
  async getLeagueReplay(
    @Param('id') id: string,
  ): Promise<BattlesimLeagueReplayDto> {
    // Rejected here rather than coerced: `parseInt("12abc")` is 12, which would
    // quietly serve a different replay than the one the link asked for.
    if (!/^\d+$/.test(id)) {
      throw new BadRequestException('Replay id must be a positive integer');
    }
    const replay = await this.leagueReplays.findReplayById(Number(id));
    if (!replay) {
      throw new NotFoundException('Replay not found');
    }
    return {
      id: replay.id,
      side1: replay.side1,
      side2: replay.side2,
      team1: replay.team1,
      team2: replay.team2,
      replay: replay.replay,
      createdAt: replay.createdAt,
    };
  }

  /**
   * GET /battlesimulator/teams
   * List caller's teams, excluding tombstones.
   */
  @Get('teams')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: "List caller's teams",
    description: 'All teams, excluding deleted ones.',
  })
  @ApiResponse({
    status: 200,
    description: 'Teams fetched',
    type: [BattlesimTeamDto],
  })
  async listTeams(
    @CurrentUser() user: AuthPrincipal,
  ): Promise<BattlesimTeamDto[]> {
    const teams = await this.repo.listTeams(user.userId);
    return teams.map(
      (team) =>
        ({
          ...team,
          tags: this.repo.parseTags(team.tags),
        }) as BattlesimTeamDto,
    );
  }

  /**
   * PUT /battlesimulator/teams/:clientId
   * Idempotent upsert of a team. Dedupes on (user_id, client_id).
   */
  @Put('teams/:clientId')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiBearerAuth('JWT')
  @ApiParam({
    name: 'clientId',
    description: 'Client-generated team id',
  })
  @ApiOperation({
    summary: 'Upload or update a team',
    description:
      'Idempotent upload. If a team with the same (user, clientId) exists, it is updated.',
  })
  @ApiResponse({
    status: 200,
    description: 'Team uploaded or updated',
    type: BattlesimTeamDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async upsertTeam(
    @CurrentUser() user: AuthPrincipal,
    @Param('clientId') clientId: string,
    @Body() dto: BattlesimTeamUploadDto,
  ): Promise<BattlesimTeamDto> {
    // Validate that the clientId in the URL matches the DTO.
    if (dto.clientId !== clientId) {
      throw new BadRequestException('clientId mismatch between URL and body');
    }

    const team = await this.repo.upsertTeam(user.userId, {
      clientId: dto.clientId,
      name: dto.name,
      format: dto.format,
      packed: dto.packed,
      tags: dto.tags ?? [],
      clientUpdatedAt: dto.clientUpdatedAt,
      deletedAt: dto.deletedAt,
    });

    return {
      ...team,
      tags: this.repo.parseTags(team.tags),
    } as BattlesimTeamDto;
  }

  /**
   * DELETE /battlesimulator/teams/:clientId
   * Tombstone a team (soft delete).
   * Idempotent: deleting an already-deleted team succeeds silently.
   */
  @Delete('teams/:clientId')
  @UseGuards(DesktopOrUserAuthGuard)
  @Clients(CLIENT.WEB, CLIENT.DESKTOP, CLIENT.INGAME)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiParam({
    name: 'clientId',
    description: 'Client-generated team id',
  })
  @ApiOperation({
    summary: 'Delete a team',
    description: 'Soft delete (tombstone). Idempotent.',
  })
  @ApiResponse({
    status: 204,
    description: 'Team deleted (or already deleted)',
  })
  async deleteTeam(
    @CurrentUser() user: AuthPrincipal,
    @Param('clientId') clientId: string,
  ): Promise<void> {
    await this.repo.deleteTeam(user.userId, clientId);
  }
}
