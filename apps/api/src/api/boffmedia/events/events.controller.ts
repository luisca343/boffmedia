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
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@api/auth/jwt-auth.guard';
import { RolesGuard } from '@api/_utils/guards/roles.guard';
import { UserThrottlerGuard } from '@api/_utils/guards/user-throttler.guard';
import { OwnerOrAdminGuard } from '@api/_utils/guards/owner-or-admin.guard';
import { FullSessionGuard } from '@api/_utils/guards/full-session.guard';
import { Roles } from '@api/_utils/decorators/roles.decorator';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { EventsFacadeService } from './events.facade.service';
import { CreateEventDto } from './dto/create-event.dto';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateEventAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto } from './dto/update-progress.dto'; // Import from DTO folder
import { UpdateEventDto } from './dto/update-event.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Event } from './entities/event.entity';
import { Game } from './entities/game.entity';
import { EventAchievement } from './entities/achievement.entity';
import { AchievementWithProgress } from './entities/achievement-with-progress.entity';
import { UpdateEventAchievementDto } from './dto/update-achievement.dto';
import { Team } from './entities/team.entity';
import { TeamMember } from './entities/team-member.entity';
import { Participant } from './entities/participant.entity';
import {
  LeaderboardEntry,
  TeamLeaderboardEntry,
} from './entities/leaderboard.entity';
import { UpdateTeamDto } from './dto/update-team.dto';
import {
  CreateEventInviteDto,
  RedeemEventInviteDto,
  SetEventStatusDto,
  SetParticipantStatusDto,
} from './dto/event-lifecycle.dto';
import {
  EventInviteEntity,
  RedeemEventInviteResponseEntity,
} from './entities/event-invite.entity';
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
  @Public()
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
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Event[]> {
    // Admins see every private event; an authenticated non-admin additionally
    // sees the private events they actively participate in (the invite flow's
    // payoff used to vanish from every listing).
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEvents({
      ...query,
      includePrivate,
      userId: req.user?.userId,
    });
  }

  @OptionalAuth()
  @Get('/event/:id')
  @Public()
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Event retrieved successfully.',
    type: Event,
  })
  async getEvent(
    @Param('id') id: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Event> {
    // A private event is only returned to admins; non-admins get not-found.
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEvent(
      id,
      includePrivate,
      req.user?.userId,
    );
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

  @Post('/event/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Set the event lifecycle status',
    description:
      'The events module owns the lifecycle. This used to be writable only as a side effect of opening a randomizer config, so an event with no randomizer could never go active and nothing ever wrote `completed`.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Status updated.',
    type: Event,
  })
  async setEventStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetEventStatusDto,
  ): Promise<Event> {
    return this.eventsFacadeService.setEventStatus(id, dto.status);
  }

  // ==================== EVENT INVITATIONS ====================

  @Post('/event/:id/invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create an invitation code for a private event' })
  @ApiResponse({ status: HttpStatus.CREATED, type: EventInviteEntity })
  async createEventInvite(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEventInviteDto,
    @Req() req: { user: { userId: number } },
  ): Promise<EventInviteEntity> {
    return this.eventsFacadeService.createEventInvite(id, req.user.userId, dto);
  }

  @Get('/event/:id/invites')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List invitation codes for an event' })
  @ApiResponse({ status: HttpStatus.OK, type: [EventInviteEntity] })
  async listEventInvites(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<EventInviteEntity[]> {
    return this.eventsFacadeService.listEventInvites(id);
  }

  @Delete('/invites/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Revoke an invitation code' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Invite revoked.' })
  async revokeEventInvite(
    @Param('code') code: string,
  ): Promise<{ success: boolean }> {
    return this.eventsFacadeService.revokeEventInvite(code);
  }

  @Post('/invites/redeem')
  @UseGuards(JwtAuthGuard, FullSessionGuard, UserThrottlerGuard)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Redeem an invitation and join the event',
    description:
      'The only way a player can join a private event. Throttled per account — redemption is the abuse surface now that membership grants pack access.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RedeemEventInviteResponseEntity,
  })
  async redeemEventInvite(
    @Body() dto: RedeemEventInviteDto,
    @Req() req: { user: { userId: number } },
  ): Promise<RedeemEventInviteResponseEntity> {
    return this.eventsFacadeService.redeemEventInvite(
      dto.code,
      req.user.userId,
    );
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
  @OptionalAuth()
  @Get('/achievements')
  @Public()
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievements retrieved successfully.',
    type: [EventAchievement],
  })
  async getAchievements(
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<EventAchievement[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getAchievements(
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get(':eventId/achievements')
  @Public()
  @ApiOperation({ summary: 'Get all achievements for an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Achievements retrieved successfully.',
    type: [EventAchievement],
  })
  async getEventAchievements(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<EventAchievement[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventAchievements(
      eventId,
      includePrivate,
      req.user?.userId,
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
    type: EventAchievement,
  })
  async createAchievement(
    @Param('eventId') eventId: number,
    @Body() createAchievementDto: CreateEventAchievementDto,
  ): Promise<EventAchievement> {
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
    type: EventAchievement,
  })
  async updateAchievement(
    @Param('eventId') eventId: number,
    @Param('achievementId') achievementId: number,
    @Body() updateAchievementDto: UpdateEventAchievementDto,
  ): Promise<EventAchievement> {
    return await this.eventsFacadeService.updateAchievement(
      eventId,
      achievementId,
      updateAchievementDto,
    );
  }

  @OptionalAuth()
  @Get('/participants/:participantId/progress')
  @Public()
  @ApiOperation({ summary: 'Get all achievement progress for a participant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participant progress retrieved successfully.',
    type: [AchievementWithProgress],
  })
  async getParticipantProgress(
    @Param('participantId') participantId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<AchievementWithProgress[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getParticipantProgress(
      participantId,
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get(':eventId/participants/:participantId/progress')
  @Public()
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
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<AchievementWithProgress[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getParticipantProgressByEvent(
      participantId,
      eventId,
      includePrivate,
      req.user?.userId,
    );
  }

  // ==================== TEAM MANAGEMENT ====================
  @OptionalAuth()
  @Get('/teams')
  @Public()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams retrieved successfully.',
    type: [Team],
  })
  async getTeams(
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Team[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getTeams(
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get(':eventId/teams')
  @Public()
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Teams retrieved successfully.',
    type: [Team],
  })
  async getEventTeams(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Team[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventTeams(
      eventId,
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get('/teams/:teamId')
  @Public()
  @ApiOperation({ summary: 'Get team by id' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team retrieved successfully.',
    type: Team,
  })
  async getTeam(
    @Param('teamId') teamId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Team> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getTeam(
      teamId,
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get('/teams/:teamId/members')
  @Public()
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team members retrieved successfully.',
    type: [TeamMember],
  })
  async getTeamMembers(
    @Param('teamId') teamId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<TeamMember[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getTeamMembers(
      teamId,
      includePrivate,
      req.user?.userId,
    );
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
  @UseGuards(JwtAuthGuard, FullSessionGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Join a team' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Joined team successfully.',
  })
  async joinTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Req() req: { user: { userId: number; roles?: string[] } },
  ): Promise<{ success: boolean }> {
    // The joining identity comes from the token, never from the body: the old
    // `participantId` field let any authenticated user enrol anyone else — and
    // it was passed straight into a parameter the service reads as a *user* id.
    return await this.eventsFacadeService.joinTeam(
      eventId,
      teamId,
      req.user.userId,
      req.user.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false,
    );
  }

  @Delete(':eventId/teams/:teamId/members/:userId')
  @UseGuards(JwtAuthGuard, FullSessionGuard, OwnerOrAdminGuard)
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
  // FullSessionGuard on every self-service membership write: membership grants
  // pack access, and an in-game MCEF token must not be able to self-grant it.
  @Post('join/:eventId')
  @UseGuards(JwtAuthGuard, FullSessionGuard)
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

  @Post(':eventId/leave')
  @UseGuards(JwtAuthGuard, FullSessionGuard)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Leave an event',
    description:
      'Self-service. Deletes the membership row, so any pack access derived from it lapses on the next server check and re-joining later is clean.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left the event.' })
  async leaveEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Req() req: { user: { userId: number } },
  ): Promise<{ success: boolean }> {
    return this.eventsFacadeService.leaveEvent(eventId, req.user.userId);
  }

  @Delete(':eventId/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({
    summary: 'Remove a participant from an event (admin)',
    description:
      'Marks the membership `removed` rather than deleting it, so the player cannot undo an expulsion by re-joining.',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant removed.' })
  async removeParticipant(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
  ): Promise<{ success: boolean }> {
    return this.eventsFacadeService.removeParticipant(eventId, participantId);
  }

  @Patch(':eventId/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(USER_ROLES.BOFF_ADMIN)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Set a participant status (admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated.' })
  async setParticipantStatus(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('participantId', ParseIntPipe) participantId: number,
    @Body() dto: SetParticipantStatusDto,
  ) {
    return this.eventsFacadeService.setParticipantStatus(
      eventId,
      participantId,
      dto.status,
    );
  }

  @OptionalAuth()
  @Get(':eventId/participants')
  @Public()
  @ApiOperation({ summary: 'Get all participants in an event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Participants retrieved successfully.',
    type: [Participant],
  })
  async getEventParticipants(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<Participant[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getEventParticipants(
      eventId,
      includePrivate,
      req.user?.userId,
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
  @Public()
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leaderboard retrieved successfully.',
    type: [LeaderboardEntry],
  })
  async getLeaderboard(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<LeaderboardEntry[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getLeaderboard(
      eventId,
      includePrivate,
      req.user?.userId,
    );
  }

  @OptionalAuth()
  @Get(':eventId/teams/leaderboard')
  @Public()
  @ApiOperation({ summary: 'Get team leaderboard for event' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Team leaderboard retrieved successfully.',
    type: [TeamLeaderboardEntry],
  })
  async getTeamLeaderboard(
    @Param('eventId') eventId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ): Promise<TeamLeaderboardEntry[]> {
    const includePrivate =
      req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false;
    return await this.eventsFacadeService.getTeamLeaderboard(
      eventId,
      includePrivate,
      req.user?.userId,
    );
  }

  // ==================== USER PROFILE ====================

  @OptionalAuth()
  @Get('users/:userId/trophies')
  @Public()
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
  async getUserTrophies(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ) {
    return await this.eventsFacadeService.getUserTrophies(userId, {
      includePrivate: req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false,
      userId: req.user?.userId,
    });
  }

  @OptionalAuth()
  @Get('users/:userId/activity')
  @Public()
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
    @Req() req: { user?: { roles?: string[]; userId?: number } },
  ) {
    return await this.eventsFacadeService.getUserActivity(userId, q.limit, {
      includePrivate: req.user?.roles?.includes(USER_ROLES.BOFF_ADMIN) ?? false,
      userId: req.user?.userId,
    });
  }
}
