import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Public } from '@api/_utils/decorators/public.decorator';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { TournamentsFacadeService } from './tournaments.facade.service';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { UpdateTournamentDto } from './dto/update-tournament.dto';
import { ListTournamentsQueryDto } from './dto/list-tournaments-query.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';
import { GenerateBracketDto } from './dto/generate-bracket.dto';
import { ReportMatchDto } from './dto/report-match.dto';
import { SetStatusDto } from './dto/set-status.dto';
import { CreatePhaseDto, UpdatePhaseDto } from './dto/create-phase.dto';
import { TournamentSummary } from './entities/tournament.entity';
import { TournamentDetail } from './entities/tournament-detail.entity';
import { Competitor } from './entities/competitor.entity';
import { MatchView } from './entities/match.entity';

type AuthedRequest = { user: { userId: number; roles?: string[] } };

@ApiTags('BoffMedia | Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly facade: TournamentsFacadeService) {}

  // ── public reads ─────────────────────────────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({ summary: 'List tournaments (game/status/format filters).' })
  @ApiResponse({ status: HttpStatus.OK, type: [TournamentSummary] })
  list(@Query() query: ListTournamentsQueryDto): Promise<TournamentSummary[]> {
    return this.facade.list(query);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Tournament detail (meta + participants + view).' })
  @ApiResponse({ status: HttpStatus.OK, type: TournamentDetail })
  getBySlug(@Param('slug') slug: string): Promise<TournamentDetail> {
    return this.facade.getBySlug(slug);
  }

  @Public()
  @Get(':slug/participants')
  @ApiOperation({ summary: 'Tournament entrants.' })
  @ApiResponse({ status: HttpStatus.OK, type: [Competitor] })
  getParticipants(@Param('slug') slug: string): Promise<Competitor[]> {
    return this.facade.getParticipants(slug);
  }

  @Public()
  @Get(':slug/matches')
  @ApiOperation({ summary: 'Flat match list (all brackets).' })
  @ApiResponse({ status: HttpStatus.OK, type: [MatchView] })
  getMatches(@Param('slug') slug: string): Promise<MatchView[]> {
    return this.facade.getMatches(slug);
  }

  // ── self-registration ────────────────────────────────────────────────────────
  @Post(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Register the current user for a tournament.' })
  register(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterParticipantDto,
    @Req() req: AuthedRequest,
  ): Promise<Competitor> {
    return this.facade.register(id, req.user.userId, dto);
  }

  @Delete(':id/register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Withdraw the current user from a tournament.' })
  withdraw(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean }> {
    return this.facade.withdraw(id, req.user.userId);
  }

  // ── admin management ─────────────────────────────────────────────────────────
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a tournament (draft).' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TournamentDetail })
  create(@Body() dto: CreateTournamentDto): Promise<TournamentDetail> {
    return this.facade.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update tournament meta.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTournamentDto,
  ): Promise<TournamentDetail> {
    return this.facade.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Soft-delete a tournament.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    return this.facade.remove(id);
  }

  @Post(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Add an entrant.' })
  addParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddParticipantDto,
  ): Promise<Competitor> {
    return this.facade.addParticipant(id, dto);
  }

  @Patch(':id/participants/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update an entrant (seed/score/status/group).' })
  updateParticipant(
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    return this.facade.updateParticipant(pid, dto);
  }

  @Delete(':id/participants/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Remove an entrant.' })
  removeParticipant(
    @Param('pid', ParseIntPipe) pid: number,
  ): Promise<{ success: boolean }> {
    return this.facade.removeParticipant(pid);
  }

  @Post(':id/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Generate the bracket/groups/schedule from seeds (→ live). Groups: call again after the group stage to seed the knockout. Swiss: call again per round.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: TournamentDetail })
  generate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: GenerateBracketDto,
  ): Promise<TournamentDetail> {
    return this.facade.generate(id, dto);
  }

  @Post(':id/matches/:mid/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Report a match result (advances the bracket).' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TournamentDetail })
  report(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Body() dto: ReportMatchDto,
  ): Promise<TournamentDetail> {
    return this.facade.report(id, mid, dto);
  }

  @Post(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Change tournament status (lifecycle).' })
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetStatusDto,
  ): Promise<TournamentDetail> {
    return this.facade.setStatus(id, dto);
  }

  // ── phases (admin) ─────────────────────────────────────────────────────────
  @Post(':id/phases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Append a phase (draft/registration, or a later pending phase while live).' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TournamentDetail })
  addPhase(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePhaseDto,
  ): Promise<TournamentDetail> {
    return this.facade.addPhase(id, dto);
  }

  @Patch(':id/phases/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Edit a pending phase.' })
  updatePhase(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: UpdatePhaseDto,
  ): Promise<TournamentDetail> {
    return this.facade.updatePhase(id, pid, dto);
  }

  @Delete(':id/phases/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Remove a pending phase (renumbers order).' })
  removePhase(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
  ): Promise<TournamentDetail> {
    return this.facade.removePhase(id, pid);
  }

  @Post(':id/advance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Close the live phase and open the next: seed qualifiers, eliminate the rest, build the next structure. On the final phase, crowns the champion.',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: TournamentDetail })
  advance(@Param('id', ParseIntPipe) id: number): Promise<TournamentDetail> {
    return this.facade.advance(id);
  }
}
