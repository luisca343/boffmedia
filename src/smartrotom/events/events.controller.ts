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
import { UpdateProgressDto, JoinTeamDto } from './events.facade.service';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

@ApiTags('boffmedia/events')
@Controller('boffmedia/events')
@UseInterceptors(ResponseInterceptor)
export class EventsController {
  constructor(
    private readonly eventsFacadeService: EventsFacadeService,
  ) {}

  // ==================== EVENT MANAGEMENT ====================
  @Get()
  @ApiOperation({ summary: 'Get all events' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Events retrieved successfully.' })
  async getEvents() {
    return await this.eventsFacadeService.getEvents();
  }

  @Get('/event/:id')
  @ApiOperation({ summary: 'Get event by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event retrieved successfully.' })
  async getEvent(@Param('id') id: number) {
    return await this.eventsFacadeService.getEvent(id);
  }

  @Post('/event')
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event created successfully.' })
  async createEvent(@Body() createEventDto: CreateEventDto) {
    return await this.eventsFacadeService.createEvent(createEventDto);
  }

  @Patch('/event/:id')
  @ApiOperation({ summary: 'Update event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event updated successfully.' })
  async updateEvent(@Param('id') id: number, @Body() createEventDto: CreateEventDto) {
    return await this.eventsFacadeService.updateEvent(id, createEventDto);
  }

  @Delete('/event/:id')
  @ApiOperation({ summary: 'Delete event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Event deleted successfully.' })
  async deleteEvent(@Param('id') id: number) {
    return await this.eventsFacadeService.deleteEvent(id);
  }

  // ==================== GAME MANAGEMENT ====================
  @Get('/games')
  @ApiOperation({ summary: 'Get all games' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Games retrieved successfully.' })
  async getGames() {
    return await this.eventsFacadeService.getGames();
  }

  @Get('/games/:id')
  @ApiOperation({ summary: 'Get game by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game retrieved successfully.' })
  async getGame(@Param('id') id: number) {
    return await this.eventsFacadeService.getGame(id);
  }

  @Post('/games')
  @ApiOperation({ summary: 'Create a new game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game created successfully.' })
  async createGame(@Body() createGameDto: CreateGameDto) {
    return await this.eventsFacadeService.createGame(createGameDto);
  }

  @Patch('/games/:id')
  @ApiOperation({ summary: 'Update game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game updated successfully.' })
  async updateGame(@Param('id') id: number, @Body() createGameDto: CreateGameDto) {
    return await this.eventsFacadeService.updateGame(id, createGameDto);
  }

  @Delete('/games/:id')
  @ApiOperation({ summary: 'Delete game' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Game deleted successfully.' })
  async deleteGame(@Param('id') id: number) {
    return await this.eventsFacadeService.deleteGame(id);
  }

  // ==================== ACHIEVEMENT MANAGEMENT ====================
  @Get('/achievements')
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievements retrieved successfully.' })
  async getAchievements() {
    return await this.eventsFacadeService.getAchievements();
  }

  @Get(':eventId/achievements')
  @ApiOperation({ summary: 'Get all achievements for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievements retrieved successfully.' })
  async getEventAchievements(@Param('eventId') eventId: number) {
    return await this.eventsFacadeService.getEventAchievements(eventId);
  }

  @Post(':eventId/achievements')
  @ApiOperation({ summary: 'Create a new achievement for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievement created successfully.' })
  async createAchievement(
    @Param('eventId') eventId: number,
    @Body() createAchievementDto: CreateAchievementDto
  ) {
    return await this.eventsFacadeService.createAchievement(eventId, createAchievementDto);
  }

  @Patch(':eventId/achievements/:achievementId')
  @ApiOperation({ summary: 'Update achievement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Achievement updated successfully.' })
  async updateAchievement(
    @Param('eventId') eventId: number,
    @Param('achievementId') achievementId: number,
    @Body() createAchievementDto: CreateAchievementDto
  ) {
    return await this.eventsFacadeService.updateAchievement(eventId, achievementId, createAchievementDto);
  }

  @Get('/participants/:participantId/progress')
  @ApiOperation({ summary: 'Get all achievement progress for a participant' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant progress retrieved successfully.' })
  async getParticipantProgress(@Param('participantId') participantId: number) {
    return await this.eventsFacadeService.getParticipantProgress(participantId);
  }

  @Get(':eventId/participants/:participantId/progress')
  @ApiOperation({ summary: 'Get achievement progress for a participant in a specific event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participant event progress retrieved successfully.' })
  async getParticipantProgressByEvent(
    @Param('eventId') eventId: number,
    @Param('participantId') participantId: number
  ) {
    return await this.eventsFacadeService.getParticipantProgressByEvent(participantId, eventId);
  }

  // ==================== TEAM MANAGEMENT ====================
  @Get('/teams')
  @ApiOperation({ summary: 'Get all teams' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Teams retrieved successfully.' })
  async getTeams() {
    return await this.eventsFacadeService.getTeams();
  }

  @Get(':eventId/teams')
  @ApiOperation({ summary: 'Get all teams in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Teams retrieved successfully.' })
  async getEventTeams(@Param('eventId') eventId: number) {
    return await this.eventsFacadeService.getEventTeams(eventId);
  }

  @Get('/teams/:teamId')
  @ApiOperation({ summary: 'Get team by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team retrieved successfully.' })
  async getTeam(@Param('teamId') teamId: number) {
    return await this.eventsFacadeService.getTeam(teamId);
  }

  @Get('/teams/:teamId/members')
  @ApiOperation({ summary: 'Get team members' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team members retrieved successfully.' })
  async getTeamMembers(@Param('teamId') teamId: number) {
    return await this.eventsFacadeService.getTeamMembers(teamId);
  }

  @Post(':eventId/teams')
  @ApiOperation({ summary: 'Create a new team for an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team created successfully.' })
  async createTeam(
    @Param('eventId') eventId: number,
    @Body() createTeamDto: CreateTeamDto
  ) {
    return await this.eventsFacadeService.createTeam(eventId, createTeamDto);
  }

  @Patch(':eventId/teams/:teamId')
  @ApiOperation({ summary: 'Update team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team updated successfully.' })
  async updateTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() createTeamDto: CreateTeamDto
  ) {
    return await this.eventsFacadeService.updateTeam(eventId, teamId, createTeamDto);
  }

  @Post(':eventId/teams/:teamId/join')
  @ApiOperation({ summary: 'Join a team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined team successfully.' })
  async joinTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Body() joinTeamDto: JoinTeamDto
  ) {
    return await this.eventsFacadeService.joinTeam(eventId, teamId, joinTeamDto);
  }

  @Delete(':eventId/teams/:teamId/members/:userId')
  @ApiOperation({ summary: 'Leave a team' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Left team successfully.' })
  async leaveTeam(
    @Param('eventId') eventId: number,
    @Param('teamId') teamId: number,
    @Param('userId') userId: number
  ) {
    return await this.eventsFacadeService.leaveTeam(eventId, teamId, userId);
  }

  // ==================== PARTICIPANT MANAGEMENT ====================
  @Post(':eventId/join')
  @ApiOperation({ summary: 'Join an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Joined event successfully.' })
  async joinEvent(
    @Param('eventId') eventId: number,
    @Body() joinEventDto: JoinEventDto
  ) {
    return await this.eventsFacadeService.joinEvent(eventId, joinEventDto);
  }

  @Get(':eventId/participants')
  @ApiOperation({ summary: 'Get all participants in an event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Participants retrieved successfully.' })
  async getEventParticipants(@Param('eventId') eventId: number) {
    return await this.eventsFacadeService.getEventParticipants(eventId);
  }

  // ==================== PROGRESS MANAGEMENT ====================
  @Put(':eventId/progress')
  @ApiOperation({ summary: 'Update progress for an achievement' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Progress updated successfully.' })
  async updateProgress(
    @Param('eventId') eventId: number,
    @Body() updateProgressDto: UpdateProgressDto
  ) {
    return await this.eventsFacadeService.updateProgress(eventId, updateProgressDto);
  }

  // ==================== LEADERBOARD MANAGEMENT ====================
  @Get('/leaderboards')
  @ApiOperation({ summary: 'Get all leaderboards' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboards retrieved successfully.' })
  async getLeaderboards() {
    return await this.eventsFacadeService.getLeaderboards();
  }

  @Get(':eventId/leaderboard')
  @ApiOperation({ summary: 'Get event leaderboard' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Leaderboard retrieved successfully.' })
  async getLeaderboard(@Param('eventId') eventId: number) {
    return await this.eventsFacadeService.getLeaderboard(eventId);
  }

  @Get(':eventId/teams/leaderboard')
  @ApiOperation({ summary: 'Get team leaderboard for event' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Team leaderboard retrieved successfully.' })
  async getTeamLeaderboard(@Param('eventId') eventId: number) {
    return await this.eventsFacadeService.getTeamLeaderboard(eventId);
  }
}