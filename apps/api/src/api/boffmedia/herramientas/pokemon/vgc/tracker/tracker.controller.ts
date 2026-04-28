import {
  Body, Controller, Delete, Get, Param, Post, Put, Query, UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
import { TrackerService } from './tracker.service';
import { CreateMatchDto, CreatePresetDto, CreateSessionDto, UpsertSeriesDto } from './dto';

@ApiTags('BoffMedia 🛠 | Pokémon VGC Tracker')
@Controller('tools/vgc/tracker')
@UseInterceptors(ResponseInterceptor)
export class TrackerController {
  constructor(private readonly service: TrackerService) {}

  // ─── Sync ─────────────────────────────────────────────────────────────────────

  @Get('sync')
  @ApiQuery({ name: 'userId', required: true, type: Number })
  @ApiOperation({ summary: 'Pull all tracker data for a user (sessions, matches, series, presets)' })
  syncAll(@Query('userId') userId: number) {
    return this.service.syncAll(+userId);
  }

  // ─── Presets ────────────────────────────────────────────────────────────────

  @Get('presets')
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOperation({ summary: 'List team presets' })
  getPresets(@Query('userId') userId?: number) {
    return this.service.getPresets(userId ? +userId : undefined);
  }

  @Put('presets/:id')
  @ApiParam({ name: 'id', description: 'Preset UUID' })
  @ApiOperation({ summary: 'Create or update a team preset' })
  upsertPreset(@Param('id') id: string, @Body() dto: CreatePresetDto) {
    return this.service.upsertPreset(id, dto);
  }

  @Delete('presets/:id')
  @ApiOperation({ summary: 'Delete a team preset' })
  deletePreset(@Param('id') id: string) {
    return this.service.deletePreset(id);
  }

  // ─── Sessions ────────────────────────────────────────────────────────────────

  @Get('sessions')
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiOperation({ summary: 'List tracking sessions' })
  getSessions(@Query('userId') userId?: number) {
    return this.service.getSessions(userId ? +userId : undefined);
  }

  @Put('sessions/:id')
  @ApiOperation({ summary: 'Create or update a session' })
  upsertSession(@Param('id') id: string, @Body() dto: CreateSessionDto) {
    return this.service.upsertSession({ ...dto, id });
  }

  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Delete a session and its matches' })
  deleteSession(@Param('id') id: string) {
    return this.service.deleteSession(id);
  }

  // ─── Matches ─────────────────────────────────────────────────────────────────

  @Get('sessions/:sessionId/matches')
  @ApiOperation({ summary: 'List matches for a session' })
  getMatches(@Param('sessionId') sessionId: string) {
    return this.service.getMatchesForSession(sessionId);
  }

  @Post('matches')
  @ApiOperation({ summary: 'Create a new match' })
  createMatch(@Body() dto: CreateMatchDto) {
    return this.service.upsertMatch(dto);
  }

  @Put('matches/:id')
  @ApiOperation({ summary: 'Upsert (create or update) a match' })
  upsertMatch(@Param('id') id: string, @Body() dto: CreateMatchDto) {
    return this.service.upsertMatch({ ...dto, id });
  }

  @Delete('matches/:id')
  @ApiOperation({ summary: 'Delete a match' })
  deleteMatch(@Param('id') id: string) {
    return this.service.deleteMatch(id);
  }

  // ─── Series ──────────────────────────────────────────────────────────────────

  @Get('sessions/:sessionId/series')
  @ApiOperation({ summary: 'List series for a session' })
  getSeries(@Param('sessionId') sessionId: string) {
    return this.service.getSeriesForSession(sessionId);
  }

  @Put('series/:id')
  @ApiParam({ name: 'id', description: 'Series UUID' })
  @ApiOperation({ summary: 'Create or update a series' })
  upsertSeries(@Param('id') id: string, @Body() dto: UpsertSeriesDto) {
    return this.service.upsertSeries({ ...dto, id });
  }

  @Delete('series/:id')
  @ApiOperation({ summary: 'Delete a series' })
  deleteSeries(@Param('id') id: string) {
    return this.service.deleteSeries(id);
  }
}
