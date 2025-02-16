import { Body, Controller, Get, Param, Post, HttpStatus, Delete, Put, Patch } from '@nestjs/common';
import { EventsService } from './events.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseService } from '@/response/response.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { CreateMedalDto } from './dto/create-medal.dto';
import { JoinTeamDto } from './dto/join-team.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';
import { CreateGameDto } from './dto/create-game.dto';

@ApiTags('boffmedia/events')
@Controller('boffmedia/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly responseService: ResponseService,
  ) {}

  // Event Management
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Events retrieved successfully.' })
  async getEvents() {
    const action = 'get events';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsService.getEvents();
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
      const result = await this.eventsService.getEvent(id);
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
      const result = await this.eventsService.createEvent(createEventDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Event created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, createEventDto);
    }
  }

  @Get('/games')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Games retrieved successfully.' })
  async getGames() {
    const action = 'get games';
    try {
      this.responseService.logRequest(action, {});
      const result = await this.eventsService.getGames();
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
      const result = await this.eventsService.getGame(id);
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
      const result = await this.eventsService.createGame(createGameDto);
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
      const result = await this.eventsService.updateGame(id, createGameDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Game updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { id, ...createGameDto });
    }
  }


  // Team Management
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
      const result = await this.eventsService.createTeam(eventId, createTeamDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...createTeamDto });
    }
  }

  @Get(':eventId/teams')
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Teams retrieved successfully.' })
  async getEventTeams(@Param('eventId') eventId: number) {
    const action = 'get event teams';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsService.getEventTeams(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Teams retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
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
      const result = await this.eventsService.joinTeam(eventId, teamId, joinTeamDto.userId);
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
      const result = await this.eventsService.leaveTeam(eventId, teamId, userId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Left team successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, teamId, userId });
    }
  }

  // Medal and Progress Management
  @Post(':eventId/medals')
  @ApiOperation({ summary: 'Create a new medal for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Medal created successfully.' })
  async createMedal(
    @Param('eventId') eventId: number,
    @Body() createMedalDto: CreateMedalDto
  ) {
    const action = 'create medal';
    try {
      console.log('eventId', eventId);
      console.log('createMedalDto', createMedalDto);
      this.responseService.logRequest(action, { eventId, ...createMedalDto });
      const result = await this.eventsService.createMedal(eventId, createMedalDto);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Medal created successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...createMedalDto });
    }
  }

  @Get(':eventId/medals')
  @ApiOperation({ summary: 'Get all medals for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Medals retrieved successfully.' })
  async getEventMedals(@Param('eventId') eventId: number) {
    const action = 'get event medals';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsService.getEventMedals(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Medals retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }

  @Put(':eventId/progress')
  @ApiOperation({ summary: 'Update progress for a medal' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Progress updated successfully.' })
  async updateProgress(
    @Param('eventId') eventId: number,
    @Body() updateProgressDto: UpdateProgressDto
  ) {
    const action = 'update progress';
    try {
      this.responseService.logRequest(action, { eventId, ...updateProgressDto });
      const result = await this.eventsService.updateProgress(
        eventId,
        updateProgressDto.userId,
        updateProgressDto.medalId,
        updateProgressDto.progress,
        updateProgressDto.teamId
      );
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Progress updated successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId, ...updateProgressDto });
    }
  }

  // Leaderboards
  @Get(':eventId/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully.' })
  async getLeaderboard(@Param('eventId') eventId: number) {
    const action = 'get leaderboard';
    try {
      this.responseService.logRequest(action, { eventId });
      const result = await this.eventsService.getLeaderboard(eventId);
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
      const result = await this.eventsService.getTeamLeaderboard(eventId);
      this.responseService.logSuccess(action, result);
      return this.responseService.createSuccessResponse('Team leaderboard retrieved successfully', result);
    } catch (error) {
      this.responseService.handleError(action, error, { eventId });
    }
  }
}