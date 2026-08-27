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
  Put,
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
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
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
import { ProposeReportDto } from './dto/propose-report.dto';
import { ConfirmReportDto } from './dto/confirm-report.dto';
import { MatchMessageDto } from './dto/match-message.dto';
import { TeamsheetDto } from './dto/teamsheet.dto';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { ScheduleMatchesDto } from './dto/schedule-matches.dto';
import { TournamentSummary } from './entities/tournament.entity';
import { TournamentDetail } from './entities/tournament-detail.entity';
import { Competitor } from './entities/competitor.entity';
import { MatchView } from './entities/match.entity';
import { MatchDetail } from './entities/match-detail.entity';
import { MatchMessageView } from './entities/match-message.entity';

type AuthedRequest = { user: { userId: number; roles?: string[] } };
type MaybeAuthedRequest = { user?: { userId: number; roles?: string[] } };

@ApiTags('BoffMedia | Tournaments')
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly facade: TournamentsFacadeService) {}

  private isAdmin(req: MaybeAuthedRequest): boolean {
    return req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
  }

  // ── public reads ─────────────────────────────────────────────────────────────
  @Public()
  @Get()
  @ApiOperation({ summary: 'List tournaments (game/status/format filters).' })
  @ApiResponse({ status: HttpStatus.OK, type: [TournamentSummary] })
  list(@Query() query: ListTournamentsQueryDto): Promise<TournamentSummary[]> {
    return this.facade.list(query);
  }

  // NOTE: declared before `:slug` so the literal path wins the route match.
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Tournaments the caller has entered (profile).' })
  mine(@Req() req: AuthedRequest) {
    return this.facade.mine(req.user.userId);
  }

  @OptionalAuth()
  @Get(':slug')
  @ApiOperation({
    summary:
      'Tournament detail (meta + participants + view). Signed-in callers also ' +
      'get their own `viewerParticipantId`.',
  })
  @ApiResponse({ status: HttpStatus.OK, type: TournamentDetail })
  getBySlug(
    @Param('slug') slug: string,
    @Req() req: MaybeAuthedRequest,
  ): Promise<TournamentDetail> {
    return this.facade.getBySlug(slug, req.user?.userId, this.isAdmin(req));
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

  @OptionalAuth()
  @Get(':slug/matches/:mid')
  @ApiOperation({
    summary:
      'Match page payload (viewer-aware: proposal perspective, opponent teamsheet).',
  })
  @ApiResponse({ status: HttpStatus.OK, type: MatchDetail })
  getMatchDetail(
    @Param('slug') slug: string,
    @Param('mid', ParseIntPipe) mid: number,
    @Req() req: MaybeAuthedRequest,
  ): Promise<MatchDetail> {
    return this.facade.getMatchDetail(
      slug,
      mid,
      req.user?.userId,
      this.isAdmin(req),
    );
  }

  // ── player self-report + match page interactions ─────────────────────────────
  @Post(':id/matches/:mid/propose')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Self-report a result (rival must verify).' })
  propose(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Body() dto: ProposeReportDto,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean }> {
    return this.facade.proposeReport(id, mid, req.user.userId, dto);
  }

  @Post(':id/matches/:mid/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Verify or dispute the rival's reported result." })
  confirm(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Body() dto: ConfirmReportDto,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean }> {
    return this.facade.confirmReport(id, mid, req.user.userId, dto);
  }

  @Get(':id/matches/:mid/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Table chat (players of the match + admins).' })
  @ApiResponse({ status: HttpStatus.OK, type: [MatchMessageView] })
  listMessages(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Query('after') after: string | undefined,
    @Req() req: AuthedRequest,
  ): Promise<MatchMessageView[]> {
    return this.facade.listMatchMessages(
      id,
      mid,
      req.user.userId,
      this.isAdmin(req),
      Number(after) || 0,
    );
  }

  @Post(':id/matches/:mid/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Post a table-chat message.' })
  postMessage(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Body() dto: MatchMessageDto,
    @Req() req: AuthedRequest,
  ): Promise<MatchMessageView> {
    return this.facade.postMatchMessage(
      id,
      mid,
      req.user.userId,
      this.isAdmin(req),
      dto.body,
    );
  }

  @Post(':id/matches/:mid/judge')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Request a judge for this table.' })
  requestJudge(
    @Param('id', ParseIntPipe) id: number,
    @Param('mid', ParseIntPipe) mid: number,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean }> {
    return this.facade.requestJudge(
      id,
      mid,
      req.user.userId,
      this.isAdmin(req),
    );
  }

  @Put(':id/teamsheet')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: "Set the caller's open teamsheet (≤6 mons)." })
  setTeamsheet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TeamsheetDto,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean }> {
    return this.facade.setTeamsheet(id, req.user.userId, dto);
  }

  @Post(':id/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Check in for the current check-in window.' })
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean; checkedInAt: string | null }> {
    return this.facade.setCheckIn(id, req.user.userId, true);
  }

  @Delete(':id/checkin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Undo the check-in.' })
  checkOut(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthedRequest,
  ): Promise<{ success: boolean; checkedInAt: string | null }> {
    return this.facade.setCheckIn(id, req.user.userId, false);
  }

  @Post(':id/submit-score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Leaderboard: submit/replace my score (drops to unverified).',
  })
  submitScore(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitScoreDto,
    @Req() req: AuthedRequest,
  ): Promise<Competitor> {
    return this.facade.submitScore(id, req.user.userId, dto);
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
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
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
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
    @Body() dto: UpdateParticipantDto,
  ): Promise<Competitor> {
    return this.facade.updateParticipant(id, pid, dto);
  }

  @Delete(':id/participants/:pid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Remove an entrant.' })
  removeParticipant(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
  ): Promise<{ success: boolean }> {
    return this.facade.removeParticipant(id, pid);
  }

  @Get(':id/entries/preview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Who would enter and who would be dropped if the field were resolved now. Read-only — generate shows this before it commits.',
  })
  entryPreview(@Param('id', ParseIntPipe) id: number) {
    return this.facade.entryPreview(id);
  }

  @Post(':id/entries/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Resolve the field now: drop everyone who has not entered, lock teamsheets and close both windows. Generate does this automatically.',
  })
  resolveEntries(@Param('id', ParseIntPipe) id: number) {
    return this.facade.resolveEntries(id);
  }

  @Post(':id/participants/:pid/readmit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Put a dropped entrant back into the field. Only while no bracket exists — after that the field is what the pairings were built from.',
  })
  readmit(
    @Param('id', ParseIntPipe) id: number,
    @Param('pid', ParseIntPipe) pid: number,
  ): Promise<{ success: boolean }> {
    return this.facade.readmit(id, pid);
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

  @Post(':id/matches/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Set/clear the scheduled time of matches (bulk).' })
  schedule(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ScheduleMatchesDto,
  ): Promise<TournamentDetail> {
    return this.facade.scheduleMatches(id, dto);
  }

  // ── phases (admin) ─────────────────────────────────────────────────────────
  @Post(':id/phases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary:
      'Append a phase (draft/registration, or a later pending phase while live).',
  })
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
