import { apiGET, apiPOST, apiPUT, apiDELETE, apiPATCH } from '@/services/boffAPI';
import type {
  CreateEventDto,
  UpdateEventDto,
  CreateGameDto,
  UpdateGameDto,
  CreateAchievementDto,
  UpdateAchievementDto,
  CreateTeamDto,
  UpdateTeamDto,
  UpdateProgressDto,
  Event,
  Game,
  Achievement,
  AchievementWithProgress,
  Team,
  TeamMember,
  Participant,
  LeaderboardEntry,
  TeamLeaderboardEntry,
  JoinTeamDto,
  SuccessResponse,
} from '@/generated/api';

export class EventsService {
  // ==================== EVENT OPERATIONS ====================
  
  /**
   * Get all events
   */
  static getEvents() {
    return apiGET<Event[]>('/boffmedia/events');
  }
  
  /**
   * Get a specific event by ID
   */
  static getEvent(id: number) {
    return apiGET<Event>(`/boffmedia/events/event/${id}`);
  }
  
  /**
   * Create a new event
   */
  static createEvent(data: any) {
    return apiPOST<any>('/boffmedia/events/event', data);
  }
  
  /**
   * Update an existing event
   */
  static updateEvent(id: number, data: UpdateEventDto) {
    return apiPATCH<Event>(`/boffmedia/events/event/${id}`, data);
  }
  
  /**
   * Delete an event
   */
  static deleteEvent(id: number) {
    return apiDELETE<SuccessResponse>(`/boffmedia/events/event/${id}`);
  }

  // ==================== GAME OPERATIONS ====================
  
  /**
   * Get all games
   */
  static getGames() {
    return apiGET<Game[]>('/boffmedia/events/games');
  }
  
  /**
   * Get a specific game by ID
   */
  static getGame(id: number) {
    return apiGET<Game>(`/boffmedia/events/games/${id}`);
  }
  
  /**
   * Create a new game
   */
  static createGame(data: CreateGameDto) {
    return apiPOST<Game>('/boffmedia/events/games', data);
  }
  
  /**
   * Update an existing game
   */
  static updateGame(id: number, data: UpdateGameDto) {
    return apiPATCH<Game>(`/boffmedia/events/games/${id}`, data);
  }
  
  /**
   * Delete a game
   */
  static deleteGame(id: number) {
    return apiDELETE<SuccessResponse>(`/boffmedia/events/games/${id}`);
  }

  // ==================== ACHIEVEMENT OPERATIONS ====================
  
  /**
   * Get all achievements
   */
  static getAchievements() {
    return apiGET<Achievement[]>('/boffmedia/events/achievements');
  }
  
  /**
   * Get all achievements for a specific event
   */
  static getEventAchievements(eventId: number) {
    return apiGET<Achievement[]>(`/boffmedia/events/${eventId}/achievements`);
  }
  
  /**
   * Create a new achievement for an event
   */
  static createAchievement(eventId: number, data: CreateAchievementDto) {
    return apiPOST<Achievement>(`/boffmedia/events/${eventId}/achievements`, data);
  }
  
  /**
   * Update an existing achievement
   */
  static updateAchievement(eventId: number, achievementId: number, data: UpdateAchievementDto) {
    return apiPATCH<Achievement>(`/boffmedia/events/${eventId}/achievements/${achievementId}`, data);
  }

  // ==================== TEAM OPERATIONS ====================
  
  /**
   * Get all teams
   */
  static getTeams() {
    return apiGET<Team[]>('/boffmedia/events/teams');
  }
  
  /**
   * Get all teams for a specific event
   */
  static getEventTeams(eventId: number) {
    return apiGET<Team[]>(`/boffmedia/events/${eventId}/teams`);
  }
  
  /**
   * Get a specific team by ID
   */
  static getTeam(teamId: number) {
    return apiGET<Team>(`/boffmedia/events/teams/${teamId}`);
  }
  
  /**
   * Get team members
   */
  static getTeamMembers(teamId: number) {
    return apiGET<TeamMember[]>(`/boffmedia/events/teams/${teamId}/members`);
  }
  
  /**
   * Create a new team for an event
   */
  static createTeam(eventId: number, data: CreateTeamDto) {
    return apiPOST<Team>(`/boffmedia/events/${eventId}/teams`, data);
  }
  
  /**
   * Update an existing team
   */
  static updateTeam(eventId: number, teamId: number, data: UpdateTeamDto) {
    return apiPATCH<Team>(`/boffmedia/events/${eventId}/teams/${teamId}`, data);
  }
  
  /**
   * Join a team
   */
  static joinTeam(eventId: number, teamId: number, data: JoinTeamDto) {
    return apiPOST<SuccessResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/join`, data);
  }
  
  /**
   * Leave a team
   */
  static leaveTeam(eventId: number, teamId: number, userId: number) {
    return apiDELETE<SuccessResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/members/${userId}`);
  }

  // ==================== PARTICIPANT OPERATIONS ====================
  
  /**
   * Join an event
   */
  static joinEvent(eventId: number, data: any) {
    return apiPOST<SuccessResponse>(`/boffmedia/events/${eventId}/join`, data);
  }
  
  /**
   * Get all participants for an event
   */
  static getEventParticipants(eventId: number) {
    return apiGET<Participant[]>(`/boffmedia/events/${eventId}/participants`);
  }

  // ==================== PROGRESS OPERATIONS ====================
  
  /**
   * Get all achievement progress for a participant
   */
  static getParticipantProgress(participantId: number) {
    return apiGET<AchievementWithProgress[]>(`/boffmedia/events/participants/${participantId}/progress`);
  }
  
  /**
   * Get achievement progress for a participant in a specific event
   */
  static getParticipantProgressByEvent(eventId: number, participantId: number) {
    return apiGET<AchievementWithProgress[]>(`/boffmedia/events/${eventId}/participants/${participantId}/progress`);
  }
  
  /**
   * Update progress for an achievement
   */
  static updateProgress(eventId: number, data: UpdateProgressDto) {
    return apiPUT<SuccessResponse>(`/boffmedia/events/${eventId}/progress`, data);
  }

  // ==================== LEADERBOARD OPERATIONS ====================
  
  /**
   * Get all leaderboards
   */
  static getLeaderboards() {
    return apiGET<LeaderboardEntry[]>('/boffmedia/events/leaderboards');
  }
  
  /**
   * Get event leaderboard
   */
  static getLeaderboard(eventId: number) {
    return apiGET<LeaderboardEntry[]>(`/boffmedia/events/${eventId}/leaderboard`);
  }
  
  /**
   * Get team leaderboard for an event
   */
  static getTeamLeaderboard(eventId: number) {
    return apiGET<TeamLeaderboardEntry[]>(`/boffmedia/events/${eventId}/teams/leaderboard`);
  }

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Get event with achievements
   */
  static async getEventWithAchievements(eventId: number) {
    const [event, achievements] = await Promise.all([
      EventsService.getEvent(eventId),
      EventsService.getEventAchievements(eventId)
    ]);
    return { event, achievements };
  }
  
  /**
   * Get event with teams and participants
   */
  static async getEventDetails(eventId: number) {
    const [event, teams, participants] = await Promise.all([
      EventsService.getEvent(eventId),
      EventsService.getEventTeams(eventId),
      EventsService.getEventParticipants(eventId)
    ]);
    return { event, teams, participants };
  }
  
  /**
   * Get full leaderboard data for an event
   */
  static async getEventLeaderboards(eventId: number) {
    const [participantLeaderboard, teamLeaderboard] = await Promise.all([
      EventsService.getLeaderboard(eventId),
      EventsService.getTeamLeaderboard(eventId)
    ]);
    return { participantLeaderboard, teamLeaderboard };
  }
  
  /**
   * Get participant's complete event data
   */
  static async getParticipantEventData(eventId: number, participantId: number) {
    const [progress, event, achievements] = await Promise.all([
      EventsService.getParticipantProgressByEvent(eventId, participantId),
      EventsService.getEvent(eventId),
      EventsService.getEventAchievements(eventId)
    ]);
    return { progress, event, achievements };
  }

  // ==================== LEGACY METHODS ====================
  
  /**
   * Legacy method: Create event (alias)
   */
  static createNewEvent(data: CreateEventDto) {
    return EventsService.createEvent(data);
  }
  
  /**
   * Legacy method: Update event (alias)
   */
  static updateEventData(id: number, data: UpdateEventDto) {
    return EventsService.updateEvent(id, data);
  }
  
  /**
   * Legacy method: Get user progress (alias)
   */
  static getUserProgress(participantId: number) {
    return EventsService.getParticipantProgress(participantId);
  }
}