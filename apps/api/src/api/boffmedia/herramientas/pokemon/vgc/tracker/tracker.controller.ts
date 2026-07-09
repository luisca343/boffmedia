import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { TrackerService } from './tracker.service';
import {
  CreateMatchDto,
  CreatePresetDto,
  CreateSessionDto,
  UpsertSeriesDto,
} from './dto';
import {
  MatchDto,
  SeriesDto,
  SessionDto,
  TeamPresetDto,
  TrackerSyncDataDto,
} from './response.dto';

@ApiTags('BoffMedia 🛠 | Pokémon VGC Tracker')
@Controller('tools/vgc/tracker')
@UseGuards(JwtAuthGuard)
export class TrackerController {
  constructor(private readonly service: TrackerService) {}

  // ─── Sync ─────────────────────────────────────────────────────────────────────

  @Get('sync')
  @ApiOperation({
    summary:
      'Pull all tracker data for a user (sessions, matches, series, presets)',
  })
  @ApiResponse({
    status: 200,
    description: 'Full tracker payload returned.',
    type: TrackerSyncDataDto,
  })
  syncAll(@Req() req: any) {
    return this.service.syncAll(req.user.userId);
  }

  // ─── Presets ────────────────────────────────────────────────────────────────

  @Get('presets')
  @ApiOperation({ summary: 'List team presets' })
  @ApiResponse({
    status: 200,
    description: 'Presets returned.',
    type: TeamPresetDto,
    isArray: true,
  })
  getPresets(@Req() req: any) {
    return this.service.getPresets(req.user.userId);
  }

  @Put('presets/:id')
  @ApiParam({ name: 'id', description: 'Preset UUID' })
  @ApiOperation({ summary: 'Create or update a team preset' })
  upsertPreset(
    @Param('id') id: string,
    @Body() dto: CreatePresetDto,
    @Req() req: any,
  ) {
    return this.service.upsertPreset(req.user.userId, id, dto);
  }

  @Delete('presets/:id')
  @ApiOperation({ summary: 'Delete a team preset' })
  deletePreset(@Param('id') id: string, @Req() req: any) {
    return this.service.deletePreset(req.user.userId, id);
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiOperation({ summary: 'List tracking sessions' })
  @ApiResponse({
    status: 200,
    description: 'Sessions returned.',
    type: SessionDto,
    isArray: true,
  })
  getSessions(@Req() req: any) {
    return this.service.getSessions(req.user.userId);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Create or update a session' })
  upsertSession(
    @Param('id') id: string,
    @Body() dto: CreateSessionDto,
    @Req() req: any,
  ) {
    return this.service.upsertSession(req.user.userId, { ...dto, id });
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a session and its matches' })
  deleteSession(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteSession(req.user.userId, id);
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  @Get('sessions/:sessionId/matches')
  @ApiOperation({ summary: 'List matches for a session' })
  @ApiResponse({
    status: 200,
    description: 'Matches returned.',
    type: MatchDto,
    isArray: true,
  })
  getMatches(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.service.getMatchesForSession(req.user.userId, sessionId);
  }

  @Post('matches')
  @ApiOperation({ summary: 'Create a new match' })
  createMatch(@Body() dto: CreateMatchDto, @Req() req: any) {
    return this.service.upsertMatch(req.user.userId, dto);
  }

  @Put('matches/:id')
  @ApiOperation({ summary: 'Upsert (create or update) a match' })
  upsertMatch(
    @Param('id') id: string,
    @Body() dto: CreateMatchDto,
    @Req() req: any,
  ) {
    return this.service.upsertMatch(req.user.userId, { ...dto, id });
  }

  @Delete('matches/:id')
  @ApiOperation({ summary: 'Delete a match' })
  deleteMatch(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteMatch(req.user.userId, id);
  }

  // ─── Series ──────────────────────────────────────────────────────────────────

  @Get('sessions/:sessionId/series')
  @ApiOperation({ summary: 'List series for a session' })
  @ApiResponse({
    status: 200,
    description: 'Series returned.',
    type: SeriesDto,
    isArray: true,
  })
  getSeries(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.service.getSeriesForSession(req.user.userId, sessionId);
  }

  @Put('series/:id')
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiOperation({ summary: 'Create or update a series' })
  upsertSeries(
    @Param('id') id: string,
    @Body() dto: UpsertSeriesDto,
    @Req() req: any,
  ) {
    return this.service.upsertSeries(req.user.userId, { ...dto, id });
  }

  @Delete('series/:id')
  @ApiOperation({ summary: 'Delete a series' })
  deleteSeries(@Param('id') id: string, @Req() req: any) {
    return this.service.deleteSeries(req.user.userId, id);
  }
}
