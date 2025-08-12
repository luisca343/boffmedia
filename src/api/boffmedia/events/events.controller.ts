import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Put,
  Body, 
  Param, 
  HttpStatus,
  UseInterceptors 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsFacadeService } from './events.facade.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto } from './dto/update-progress.dto'; // Import from DTO folder
import { JoinTeamDto } from './dto/join-team.dto'; // Import from DTO folder
import { ResponseInterceptor } from '@api/_utils/interceptors/response.interceptor';
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
import { LeaderboardEntry, TeamLeaderboardEntry } from './entities/leaderboard.entity';
import { UpdateTeamDto } from './dto/update-team.dto';


@ApiTags('BoffMedia | Events')
@Controller('events')
@UseInterceptors(ResponseInterceptor)
export class EventsController {
  constructor(
    private readonly eventsFacadeService: EventsFacadeService,
  ) {}

  // ==================== EVENT MANAGEMENT ====================
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Events retrieved successfully.',
    type: [Event]
  })
  async getEvents(): Promise<Event[]> {
    return await this.eventsFacadeService.getEvents();
  }

  @Get('/event/:id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Event retrieved successfully.',
    type: Event
  })
  async getEvent(@Param('id') id: number): Promise<Event> {
    return await this.eventsFacadeService.getEvent(id);
  }

  @Post('/event')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Event created successfully.',
    type: Event
  })
  async createEvent(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return await this.eventsFacadeService.createEvent(createEventDto);
  }

  @Patch('/event/:id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Event updated successfully.',
    type: Event
  })
  async updateEvent(
    @Param('id') id: number, 
    @Body() updateEventDto: UpdateEventDto
  ): Promise<Event> {
    return await this.eventsFacadeService.updateEvent(id, updateEventDto);
  }

  @Delete('/event/:id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Event deleted successfully.'
  })
  async deleteEvent(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.eventsFacadeService.deleteEvent(id);
    return { success: true };
  }

  // ==================== GAME MANAGEMENT ====================
  @Get('/games')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Games retrieved successfully.',
    type: [Game]
  })
  async getGames(): Promise<Game[]> {
    return await this.eventsFacadeService.getGames();
  }

  @Get('/games/:id')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game retrieved successfully.',
    type: Game
  })
  async getGame(@Param('id') id: number): Promise<Game> {
    return await this.eventsFacadeService.getGame(id);
  }

  @Post('/games')
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Game created successfully.',
    type: Game
  })
  async createGame(@Body() createGameDto: CreateGameDto): Promise<Game> {
    return await this.eventsFacadeService.createGame(createGameDto);
  }

  @Patch('/games/:id')
  @ApiOperation({ summary: 'Update game' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game updated successfully.',
    type: Game
  })
  async updateGame(
    @Param('id') id: number, 
    @Body() updateGameDto: UpdateGameDto
  ): Promise<Game> {
    return await this.eventsFacadeService.updateGame(id, updateGameDto);
  }

  @Delete('/games/:id')
  @ApiOperation({ summary: 'Delete game' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Game deleted successfully.'
  })
  async deleteGame(@Param('id') id: number): Promise<{ success: boolean }> {
    await this.eventsFacadeService.deleteGame(id);
    return { success: true };
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  @Get('/achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Achievements retrieved successfully.',
    type: [Achievement]
  })
  async getAchievements(): Promise<Achievement[]> {
    return await this.eventsFacadeService.getAchievements();
  }

  @Get(':eventId/achievements')
  @ApiOperation({ summary: 'Get all achievements for an event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Achievements retrieved successfully.',
    type: [Achievement]
  })
  async getEventAchievements(@Param('eventId') eventId: number): Promise<Achievement[]> {
    return await this.eventsFacadeService.getEventAchievements(eventId);
  }

  @Post(':eventId/achievements')
  @ApiOperation({ summary: 'Create a new achievement for an event' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Achievement created successfully.',
    type: Achievement
  })
  async createAchievement(
    @Param('eventId') eventId: number,
    @Body() createAchievementDto: CreateAchievementDto
  ): Promise<Achievement> {
    return await this.eventsFacadeService.createAchievement(eventId, createAchievementDto);
  }

  @Patch(':eventId/achievements/:achievementId')
  @ApiOperation({ summary: 'Update achievement' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Achievement updated successfully.',
    type: Achievement
  })
  async updateAchievement(
    @Param('eventId') eventId: number,
    @Param('achievementId') achievementId: number,
    @Body() updateAchievementDto: UpdateAchievementDto
  ): Promise<Achievement> {
    return await this.eventsFacadeService.updateAchievement(eventId, achievementId, updateAchievementDto);
  }

  @Get('/participants/:participantId/progress')
  @ApiOperation({ summary: 'Get all achievement progress for a participant' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Participant progress retrieved successfully.',
    type: [AchievementWithProgress]
  })
  async getParticipantProgress(@Param('participantId') participantId: number): Promise<AchievementWithProgress[]> {
    return await this.eventsFacadeService.getParticipantProgress(participantId);
  }

  @Get(':eventId/participants/:participantId/progress')
  @ApiOperation({ summary: 'Get achievement progress for a participant in a specific event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Participant event progress retrieved successfully.',
    type: [AchievementWithProgress]
  })
  async getParticipantProgressByEvent(
    @Param('eventId') eventId: number,
    @Param('participantId') participantId: number
  ): Promise<AchievementWithProgress[]> {
    return await this.eventsFacadeService.getParticipantProgressByEvent(participantId, eventId);
  }

  // ==================== TEAM MANAGEMENT ====================
  @Get('/teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Teams retrieved successfully.',
    type: [Team]
  })
  async getTeams(): Promise<Team[]> {
    return await this.eventsFacadeService.getTeams();
  }

  @Get(':eventId/teams')
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Teams retrieved successfully.',
    type: [Team]
  })
  async getEventTeams(@Param('eventId') eventId: number): Promise<Team[]> {
    return await this.eventsFacadeService.getEventTeams(eventId);
  }

  @Get('/teams/:teamId')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Team retrieved successfully.',
    type: Team
  })
  async getTeam(@Param('teamId') teamId: number): Promise<Team> {
    return await this.eventsFacadeService.getTeam(teamId);
  }

  @Get('/teams/:teamId/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Team members retrieved successfully.',
    type: [TeamMember]
  })
  async getTeamMembers(@Param('teamId') teamId: number): Promise<TeamMember[]> {
    return await this.eventsFacadeService.getTeamMembers(teamId);
  }

  @Post(':eventId/teams')
  @ApiOperation({ summary: 'Create a new team for an event' })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Team created successfully.',
    type: Team
  })
  async createTeam(
    @Param('eventId') eventId: number,
    @Body() createTeamDto: CreateTeamDto
  ): Promise<Team> {
    return await this.eventsFacadeService.createTeam(eventId, createTeamDto);
  }

  @Patch(':eventId/teams/:teamId')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Team updated successfully.',
    type: Team
  })
  async updateTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() updateTeamDto: UpdateTeamDto
  ): Promise<Team> {
    return await this.eventsFacadeService.updateTeam(eventId, teamId, updateTeamDto);
  }

  @Post(':eventId/teams/:teamId/join')
  @ApiOperation({ summary: 'Join a team' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Joined team successfully.'
  })
  async joinTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() joinTeamDto: JoinTeamDto
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.joinTeam(eventId, teamId, joinTeamDto);
  }

  @Delete(':eventId/teams/:teamId/members/:userId')
  @ApiOperation({ summary: 'Leave a team' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Left team successfully.'
  })
  async leaveTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Param('userId') userId: number
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.leaveTeam(eventId, teamId, userId);
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  @Post(':eventId/join')
  @ApiOperation({ summary: 'Join an event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Joined event successfully.'
  })
  async joinEvent(
    @Param('eventId') eventId: number,
    @Body() joinEventDto: JoinEventDto
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.joinEvent(eventId, joinEventDto);
  }

  @Get(':eventId/participants')
  @ApiOperation({ summary: 'Get all participants in an event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Participants retrieved successfully.',
    type: [Participant]
  })
  async getEventParticipants(@Param('eventId') eventId: number): Promise<Participant[]> {
    return await this.eventsFacadeService.getEventParticipants(eventId);
  }

  // ==================== PROGRESS MANAGEMENT ====================
  @Put(':eventId/progress')
  @ApiOperation({ summary: 'Update progress for an achievement' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Progress updated successfully.'
  })
  async updateProgress(
    @Param('eventId') eventId: number,
    @Body() updateProgressDto: UpdateProgressDto
  ): Promise<{ success: boolean }> {
    return await this.eventsFacadeService.updateProgress(eventId, updateProgressDto);
  }
  // ==================== LEADERBOARD MANAGEMENT ====================
  @Get('/leaderboards')
  @ApiOperation({ summary: 'Get all leaderboards' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Leaderboards retrieved successfully.',
    type: [LeaderboardEntry]
  })
  async getLeaderboards(): Promise<LeaderboardEntry[]> {
    return await this.eventsFacadeService.getLeaderboards();
  }

  @Get(':eventId/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Leaderboard retrieved successfully.',
    type: [LeaderboardEntry]
  })
  async getLeaderboard(@Param('eventId') eventId: number): Promise<LeaderboardEntry[]> {
    return await this.eventsFacadeService.getLeaderboard(eventId);
  }

  @Get(':eventId/teams/leaderboard')
  @ApiOperation({ summary: 'Get team leaderboard for event' })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Team leaderboard retrieved successfully.',
    type: [TeamLeaderboardEntry]
  })
  async getTeamLeaderboard(@Param('eventId') eventId: number): Promise<TeamLeaderboardEntry[]> {
    return await this.eventsFacadeService.getTeamLeaderboard(eventId);
  }
}