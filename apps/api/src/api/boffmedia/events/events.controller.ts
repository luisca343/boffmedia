import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { Public } from '@api/_utils/decorators/public.decorator';
import { PaginationQueryDto } from '@api/_utils/dto/pagination.dto';
import { OptionalAuth } from '@api/_utils/decorators/optional-auth.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { OwnerOrAdminGuard } from '@api/_utils/guards/owner-or-admin.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { EventsFacadeService } from './events.facade.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto } from './dto/update-progress.dto'; // Import from DTO folder
import { JoinTeamDto } from './dto/join-team.dto'; // Import from DTO folder
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Event } from './entities/event.entity';
import { Game } from './entities/game.entity';
import { Achievement } from './entities/achievement.entity';
import { AchievementWithProgress } from './entities/achievement-with-progress.entity';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Participant } from './entities/participant.entity';
import {
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from './entities/leaderboard.entity';
import { UpdateTeamDto } from './dto/update-team.dto';
import {
  UserTrophiesEntity,
  UserActivityItemEntity,
} from './entities/profile.entity';

@ApiTags('BoffMedia | Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsFacadeService: EventsFacadeService) {}

  // ==================== EVENT MANAGEMENT ====================
  @OptionalAuth()
  @Get()
  @ApiOperation({
    summary:
      'Get all events (optional status/gameId/type filters + pagination)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Events retrieved successfully.',
    type: [Event],
  })
  async getEvents(
    @Query() query: ListEventsQueryDto,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<Event[]> {
    // Private events are only exposed to admins; anonymous/non-admin callers
    // (public pages) get public events only.
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEvents({
      ...query,
      includePrivate,
    });
  }

  @OptionalAuth()
  @Get('/event/:id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event retrieved successfully.',
    type: Event,
  })
  async getEvent(
    @Param('id') id: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<Event> {
    // A private event is only returned to admins; non-admins get not-found.
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEvent(id, includePrivate);
  }

  @Post('/event')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event created successfully.',
    type: Event,
  })
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return await this.eventsFacadeService.createEvent(createEventDto);
  }

  @Patch('/event/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event updated successfully.',
    type: Event,
  })
  async updateEvent(
    @Param('id') id: number,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return await this.eventsFacadeService.updateEvent(id, updateEventDto);
  }

  @Delete('/event/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event deleted successfully.',
  })
  async deleteEvent(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.eventsFacadeService.deleteEvent(id);
    return { success: true };
  }

  // ==================== GAME MANAGEMENT ====================
  @Public()
  @Get('/games')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Games retrieved successfully.',
    type: [Game],
  })
  async getGames(): Promise<Game[]> {
    return await this.eventsFacadeService.getGames();
  }

  @Public()
  @Get('/games/:id')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Game retrieved successfully.',
    type: Game,
  })
  async getGame(@Param('id') id: number): Promise<Game> {
    return await this.eventsFacadeService.getGame(id);
  }

  @Post('/games')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Game created successfully.',
    type: Game,
  })
  async createGame(@Body() createGameDto: CreateGameDto): Promise<Game> {
    return await this.eventsFacadeService.createGame(createGameDto);
  }

  @Patch('/games/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update game' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Game updated successfully.',
    type: Game,
  })
  async updateGame(
    @Param('id') id: number,
    @Body() updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    return await this.eventsFacadeService.updateGame(id, updateGameDto);
  }

  @Delete('/games/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete game' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Game deleted successfully.',
  })
  async deleteGame(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.eventsFacadeService.deleteGame(id);
    return { success: true };
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  @Public()
  @Get('/achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievements retrieved successfully.',
    type: [Achievement],
  })
  async getAchievements(): Promise<Achievement[]> {
    return await this.eventsFacadeService.getAchievements();
  }

  @OptionalAuth()
  @Get(':eventId/achievements')
  @ApiOperation({ summary: 'Get all achievements for an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievements retrieved successfully.',
    type: [Achievement],
  })
  async getEventAchievements(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<Achievement[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventAchievements(
      eventId,
      includePrivate,
    );
  }

  @Post(':eventId/achievements')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new achievement for an event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Achievement created successfully.',
    type: Achievement,
  })
  async createAchievement(
    @Param('eventId') eventId: number,
    @Body() createAchievementDto: CreateAchievementDto,
  ): Promise<Achievement> {
    return await this.eventsFacadeService.createAchievement(
      eventId,
      createAchievementDto,
    );
  }

  @Patch(':eventId/achievements/:achievementId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update achievement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievement updated successfully.',
    type: Achievement,
  })
  async updateAchievement(
    @Param('eventId') eventId: number,
    @Param('achievementId') achievementId: number,
    @Body() updateAchievementDto: UpdateAchievementDto,
  ): Promise<Achievement> {
    return await this.eventsFacadeService.updateAchievement(
      eventId,
      achievementId,
      updateAchievementDto,
    );
  }

  @Public()
  @Get('/participants/:participantId/progress')
  @ApiOperation({ summary: 'Get all achievement progress for a participant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant progress retrieved successfully.',
    type: [AchievementWithProgress],
  })
  async getParticipantProgress(
    @Param('participantId') participantId: number,
  ): Promise<AchievementWithProgress[]> {
    return await this.eventsFacadeService.getParticipantProgress(participantId);
  }

  @OptionalAuth()
  @Get(':eventId/participants/:participantId/progress')
  @ApiOperation({
    summary: 'Get achievement progress for a participant in a specific event',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant event progress retrieved successfully.',
    type: [AchievementWithProgress],
  })
  async getParticipantProgressByEvent(
    @Param('eventId') eventId: number,
    @Param('participantId') participantId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<AchievementWithProgress[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getParticipantProgressByEvent(
      participantId,
      eventId,
      includePrivate,
    );
  }

  // ==================== TEAM MANAGEMENT ====================
  @Public()
  @Get('/teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams retrieved successfully.',
    type: [Team],
  })
  async getTeams(): Promise<Team[]> {
    return await this.eventsFacadeService.getTeams();
  }

  @OptionalAuth()
  @Get(':eventId/teams')
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams retrieved successfully.',
    type: [Team],
  })
  async getEventTeams(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<Team[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventTeams(
      eventId,
      includePrivate,
    );
  }

  @Public()
  @Get('/teams/:teamId')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team retrieved successfully.',
    type: Team,
  })
  async getTeam(@Param('teamId') teamId: number): Promise<Team> {
    return await this.eventsFacadeService.getTeam(teamId);
  }

  @Public()
  @Get('/teams/:teamId/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team members retrieved successfully.',
    type: [TeamMember],
  })
  async getTeamMembers(@Param('teamId') teamId: number): Promise<TeamMember[]> {
    return await this.eventsFacadeService.getTeamMembers(teamId);
  }

  @Post(':eventId/teams')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create a new team for an event' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Team created successfully.',
    type: Team,
  })
  async createTeam(
    @Param('eventId') eventId: number,
    @Body() createTeamDto: CreateTeamDto,
  ): Promise<Team> {
    return await this.eventsFacadeService.createTeam(eventId, createTeamDto);
  }

  @Patch(':eventId/teams/:teamId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team updated successfully.',
    type: Team,
  })
  async updateTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ): Promise<Team> {
    return await this.eventsFacadeService.updateTeam(
      eventId,
      teamId,
      updateTeamDto,
    );
  }

  @Post(':eventId/teams/:teamId/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Join a team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Joined team successfully.',
  })
  async joinTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() joinTeamDto: JoinTeamDto,
  ): Promise<{ success: boolean }> {
    // TODO(roadmap): verify joinTeamDto.participantId belongs to req.user.
    return await this.eventsFacadeService.joinTeam(
      eventId,
      teamId,
      joinTeamDto,
    );
  }

  @Delete(':eventId/teams/:teamId/members/:userId')
  @UseGuards(JwtAuthGuard, OwnerOrAdminGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Leave a team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Left team successfully.',
  })
  async leaveTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Param('userId') userId: number,
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.leaveTeam(eventId, teamId, userId);
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  @Post('join/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Join an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Joined event successfully.',
  })
  async joinEvent(
    @Param('eventId') eventId: number,
    @Body() joinEventDto: JoinEventDto,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: boolean }> {
    // Identity comes from the JWT, never the request body (anti-spoofing).
    joinEventDto.userId = req.user.userId;
    return await this.eventsFacadeService.joinEvent(eventId, joinEventDto);
  }

  @OptionalAuth()
  @Get(':eventId/participants')
  @ApiOperation({ summary: 'Get all participants in an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participants retrieved successfully.',
    type: [Participant],
  })
  async getEventParticipants(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<Participant[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventParticipants(
      eventId,
      includePrivate,
    );
  }

  // ==================== PROGRESS MANAGEMENT ====================
  @Put(':eventId/progress')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update progress for an achievement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Progress updated successfully.',
  })
  async updateProgress(
    @Param('eventId') eventId: number,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.updateProgress(
      eventId,
      updateProgressDto,
    );
  }
  // ==================== LEADERBOARD MANAGEMENT ====================
  @Public()
  @Get('/leaderboards')
  @ApiOperation({ summary: 'Get all leaderboards' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leaderboards retrieved successfully.',
    type: [LeaderboardEntry],
  })
  async getLeaderboards(): Promise<LeaderboardEntry[]> {
    return await this.eventsFacadeService.getLeaderboards();
  }

  @OptionalAuth()
  @Get(':eventId/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leaderboard retrieved successfully.',
    type: [LeaderboardEntry],
  })
  async getLeaderboard(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<LeaderboardEntry[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getLeaderboard(
      eventId,
      includePrivate,
    );
  }

  @OptionalAuth()
  @Get(':eventId/teams/leaderboard')
  @ApiOperation({ summary: 'Get team leaderboard for event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team leaderboard retrieved successfully.',
    type: [TeamLeaderboardEntry],
  })
  async getTeamLeaderboard(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[] } },
  ): Promise<TeamLeaderboardEntry[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getTeamLeaderboard(
      eventId,
      includePrivate,
    );
  }

  // ==================== USER PROFILE ====================

  @Public()
  @Get('users/:userId/trophies')
  @ApiOperation({ summary: "Get a user's trophy case (earned + locked)" })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'BoffMedia user ID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Trophy case retrieved successfully.',
    type: UserTrophiesEntity,
  })
  async getUserTrophies(@Param('userId', ParseIntPipe) userId: number) {
    return await this.eventsFacadeService.getUserTrophies(userId);
  }

  @Public()
  @Get('users/:userId/activity')
  @ApiOperation({ summary: "Get a user's activity timeline" })
  @ApiParam({
    name: 'userId',
    type: 'number',
    description: 'BoffMedia user ID',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Activity timeline retrieved successfully.',
    type: [UserActivityItemEntity],
  })
  async getUserActivity(
    @Param('userId', ParseIntPipe) userId: number,
    @Query() q: PaginationQueryDto,
  ) {
    return await this.eventsFacadeService.getUserActivity(userId, q.limit);
  }
}
