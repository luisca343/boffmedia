import { 
  Controller, 
  Get, 
  Post, 
  Patch, 
  Delete, 
  Put,
  Body, 
  Param, 
  HttpStatus 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EventsFacadeService } from './events.facade.service';
import { ResponseService } from '@/response/response.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateGameDto } from './dto/create-game.dto';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinEventDto } from './dto/join-event.dto';
import { UpdateProgressDto, JoinTeamDto } from './events.facade.service';

@ApiTags('boffmedia/events')
@Controller('boffmedia/events')
export class EventsController {
  constructor(
    private readonly eventsFacadeService: EventsFacadeService,
    private readonly responseService: ResponseService,
  ) {}

  // ==================== EVENT MANAGEMENT ====================
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Events retrieved successfully.' })
  async getEvents() {
    const action = 'get events';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsFacadeService.getEvents();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Events retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('/event/:id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event retrieved successfully.' })
  async getEvent(@Param('id') id: number) {
    const action = 'get event';
    try {
      this.responseService.logRequest(action, { id });
      const result = await this.eventsFacadeService.getEvent(id);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Event retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }

  @Post('/event')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event created successfully.' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    const action = 'create event';
    try {
      this.responseService.logRequest(action, createEventDto);
      const result = await this.eventsFacadeService.createEvent(createEventDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Event created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, createEventDto);
    }
  }

  @Patch('/event/:id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event updated successfully.' })
  async updateEvent(@Param('id') id: number, @Body() createEventDto: CreateEventDto) {
    const action = 'update event';
    try {
      this.responseService.logRequest(action, { id, ...createEventDto });
      const result = await this.eventsFacadeService.updateEvent(id, createEventDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Event updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id, ...createEventDto });
    }
  }

  @Delete('/event/:id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event deleted successfully.' })
  async deleteEvent(@Param('id') id: number) {
    const action = 'delete event';
    try {
      this.responseService.logRequest(action, { id });
      await this.eventsFacadeService.deleteEvent(id);
      this.responseService.logSuccess(action, null);
      return this.responseService.createSuccessResponse('Event deleted successfully', null);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }

  // ==================== GAME MANAGEMENT ====================
  @Get('/games')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Games retrieved successfully.' })
  async getGames() {
    const action = 'get games';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsFacadeService.getGames();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Games retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get('/games/:id')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game retrieved successfully.' })
  async getGame(@Param('id') id: number) {
    const action = 'get game';
    try {
      this.responseService.logRequest(action, { id });
      const result = await this.eventsFacadeService.getGame(id);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }

  @Post('/games')
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game created successfully.' })
  async createGame(@Body() createGameDto: CreateGameDto) {
    const action = 'create game';
    try {
      this.responseService.logRequest(action, createGameDto);
      const result = await this.eventsFacadeService.createGame(createGameDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, createGameDto);
    }
  }

  @Patch('games/:id')
  @ApiOperation({ summary: 'Update game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game updated successfully.' })
  async updateGame(@Param('id') id: number, @Body() createGameDto: CreateGameDto) {
    const action = 'update game';
    try {
      this.responseService.logRequest(action, { id, ...createGameDto });
      const result = await this.eventsFacadeService.updateGame(id, createGameDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id, ...createGameDto });
    }
  }

  @Delete('/games/:id')
  @ApiOperation({ summary: 'Delete game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game deleted successfully.' })
  async deleteGame(@Param('id') id: number) {
    const action = 'delete game';
    try {
      this.responseService.logRequest(action, { id });
      await this.eventsFacadeService.deleteGame(id);
      this.responseService.logSuccess(action, null);
      return this.responseService.createSuccessResponse('Game deleted successfully', null);
    } catch (error) {
      this.responseService.handleError(action, error, { id });
    }
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  @Get('/achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievements retrieved successfully.' })
  async getAchievements() {
    const action = 'get achievements';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsFacadeService.getAchievements();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Achievements retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get(':eventId/achievements')
  @ApiOperation({ summary: 'Get all achievements for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievements retrieved successfully.' })
  async getEventAchievements(@Param('eventId') eventId: number) {
    const action = 'get event achievements';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsFacadeService.getEventAchievements(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Achievements retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }

  @Post(':eventId/achievements')
  @ApiOperation({ summary: 'Create a new achievement for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievement created successfully.' })
  async createAchievement(
    @Param('eventId') eventId: number,
    @Body() createAchievementDto: CreateAchievementDto
  ) {
    const action = 'create achievement';
    try {
      this.responseService.logRequest(action, { eventId, ...createAchievementDto });
      const result = await this.eventsFacadeService.createAchievement(eventId, createAchievementDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Achievement created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...createAchievementDto });
    }
  }

  @Patch(':eventId/achievements/:achievementId')
  @ApiOperation({ summary: 'Update achievement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievement updated successfully.' })
  async updateAchievement(
    @Param('eventId') eventId: number,
    @Param('achievementId') achievementId: number,
    @Body() createAchievementDto: CreateAchievementDto
  ) {
    const action = 'update achievement';
    try {
      this.responseService.logRequest(action, { eventId, achievementId, ...createAchievementDto });
      const result = await this.eventsFacadeService.updateAchievement(eventId, achievementId, createAchievementDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Achievement updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, achievementId, ...createAchievementDto });
    }
  }

  // ==================== TEAM MANAGEMENT ====================
  @Get('/teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Teams retrieved successfully.' })
  async getTeams() {
    const action = 'get teams';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsFacadeService.getTeams();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Teams retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get(':eventId/teams')
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Teams retrieved successfully.' })
  async getEventTeams(@Param('eventId') eventId: number) {
    const action = 'get event teams';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsFacadeService.getEventTeams(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Teams retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }

  @Get('/teams/:teamId')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team retrieved successfully.' })
  async getTeam(@Param('teamId') teamId: number) {
    const action = 'get team';
    try {
      this.responseService.logRequest(action, { teamId });
      const result = await this.eventsFacadeService.getTeam(teamId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { teamId });
    }
  }

  @Get('/teams/:teamId/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team members retrieved successfully.' })
  async getTeamMembers(@Param('teamId') teamId: number) {
    const action = 'get team members';
    try {
      this.responseService.logRequest(action, { teamId });
      const result = await this.eventsFacadeService.getTeamMembers(teamId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team members retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { teamId });
    }
  }

  @Post(':eventId/teams')
  @ApiOperation({ summary: 'Create a new team for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team created successfully.' })
  async createTeam(
    @Param('eventId') eventId: number,
    @Body() createTeamDto: CreateTeamDto
  ) {
    const action = 'create team';
    try {
      this.responseService.logRequest(action, { eventId, ...createTeamDto });
      const result = await this.eventsFacadeService.createTeam(eventId, createTeamDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...createTeamDto });
    }
  }

  @Patch(':eventId/teams/:teamId')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team updated successfully.' })
  async updateTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() createTeamDto: CreateTeamDto
  ) {
    const action = 'update team';
    try {
      this.responseService.logRequest(action, { eventId, teamId, ...createTeamDto });
      const result = await this.eventsFacadeService.updateTeam(eventId, teamId, createTeamDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, teamId, ...createTeamDto });
    }
  }

  @Post(':eventId/teams/:teamId/join')
  @ApiOperation({ summary: 'Join a team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined team successfully.' })
  async joinTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() joinTeamDto: JoinTeamDto
  ) {
    const action = 'join team';
    try {
      this.responseService.logRequest(action, { eventId, teamId, ...joinTeamDto });
      const result = await this.eventsFacadeService.joinTeam(eventId, teamId, joinTeamDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Joined team successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, teamId, ...joinTeamDto });
    }
  }

  @Delete(':eventId/teams/:teamId/members/:userId')
  @ApiOperation({ summary: 'Leave a team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left team successfully.' })
  async leaveTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Param('userId') userId: number
  ) {
    const action = 'leave team';
    try {
      this.responseService.logRequest(action, { eventId, teamId, userId });
      const result = await this.eventsFacadeService.leaveTeam(eventId, teamId, userId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Left team successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, teamId, userId });
    }
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  @Post(':eventId/join')
  @ApiOperation({ summary: 'Join an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined event successfully.' })
  async joinEvent(
    @Param('eventId') eventId: number,
    @Body() joinEventDto: JoinEventDto
  ) {
    const action = 'join event';
    try {
      this.responseService.logRequest(action, { eventId, ...joinEventDto });
      const result = await this.eventsFacadeService.joinEvent(eventId, joinEventDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Joined event successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...joinEventDto });
    }
  }

  @Get(':eventId/participants')
  @ApiOperation({ summary: 'Get all participants in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participants retrieved successfully.' })
  async getEventParticipants(@Param('eventId') eventId: number) {
    const action = 'get event participants';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsFacadeService.getEventParticipants(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Participants retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }

  // ==================== PROGRESS MANAGEMENT ====================
  @Put(':eventId/progress')
  @ApiOperation({ summary: 'Update progress for an achievement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Progress updated successfully.' })
  async updateProgress(
    @Param('eventId') eventId: number,
    @Body() updateProgressDto: UpdateProgressDto
  ) {
    const action = 'update progress';
    try {
      this.responseService.logRequest(action, { eventId, ...updateProgressDto });
      const result = await this.eventsFacadeService.updateProgress(eventId, updateProgressDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Progress updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...updateProgressDto });
    }
  }

  // ==================== LEADERBOARD MANAGEMENT ====================
  @Get('/leaderboards')
  @ApiOperation({ summary: 'Get all leaderboards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboards retrieved successfully.' })
  async getLeaderboards() {
    const action = 'get leaderboards';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsFacadeService.getLeaderboards();
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Leaderboards retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error);
    }
  }

  @Get(':eventId/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully.' })
  async getLeaderboard(@Param('eventId') eventId: number) {
    const action = 'get leaderboard';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsFacadeService.getLeaderboard(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Leaderboard retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }

  @Get(':eventId/teams/leaderboard')
  @ApiOperation({ summary: 'Get team leaderboard for event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team leaderboard retrieved successfully.' })
  async getTeamLeaderboard(@Param('eventId') eventId: number) {
    const action = 'get team leaderboard';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsFacadeService.getTeamLeaderboard(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team leaderboard retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }
}