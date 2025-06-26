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
  JoinEventDto,
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
export const eventsService = {
  // ==================== EVENT OPERATIONS ====================
  
  /**
   * Get all events
   */
  getEvents: () => apiGET<Event[]>('/boffmedia/events'),
  
  /**
   * Get a specific event by ID
   */
  getEvent: (id: number) => apiGET<Event>(`/boffmedia/events/event/${id}`),
  
  /**
   * Create a new event
   */
  createEvent: (data: any) => apiPOST<any>('/boffmedia/events/event', data),
  
  /**
   * Update an existing event
   */
  updateEvent: (id: number, data: UpdateEventDto) => 
    apiPATCH<Event>(`/boffmedia/events/event/${id}`, data),
  
  /**
   * Delete an event
   */
  deleteEvent: (id: number) => apiDELETE<SuccessResponse>(`/boffmedia/events/event/${id}`),

  // ==================== GAME OPERATIONS ====================
  
  /**
   * Get all games
   */
  getGames: () => apiGET<Game[]>('/boffmedia/events/games'),
  
  /**
   * Get a specific game by ID
   */
  getGame: (id: number) => apiGET<Game>(`/boffmedia/events/games/${id}`),
  
  /**
   * Create a new game
   */
  createGame: (data: CreateGameDto) => apiPOST<Game>('/boffmedia/events/games', data),
  
  /**
   * Update an existing game
   */
  updateGame: (id: number, data: UpdateGameDto) => 
    apiPATCH<Game>(`/boffmedia/events/games/${id}`, data),
  
  /**
   * Delete a game
   */
  deleteGame: (id: number) => apiDELETE<SuccessResponse>(`/boffmedia/events/games/${id}`),

  // ==================== ACHIEVEMENT OPERATIONS ====================
  
  /**
   * Get all achievements
   */
  getAchievements: () => apiGET<Achievement[]>('/boffmedia/events/achievements'),
  
  /**
   * Get all achievements for a specific event
   */
  getEventAchievements: (eventId: number) => 
    apiGET<Achievement[]>(`/boffmedia/events/${eventId}/achievements`),
  
  /**
   * Create a new achievement for an event
   */
  createAchievement: (eventId: number, data: CreateAchievementDto) => 
    apiPOST<Achievement>(`/boffmedia/events/${eventId}/achievements`, data),
  
  /**
   * Update an existing achievement
   */
  updateAchievement: (eventId: number, achievementId: number, data: UpdateAchievementDto) => 
    apiPATCH<Achievement>(`/boffmedia/events/${eventId}/achievements/${achievementId}`, data),

  // ==================== TEAM OPERATIONS ====================
  
  /**
   * Get all teams
   */
  getTeams: () => apiGET<Team[]>('/boffmedia/events/teams'),
  
  /**
   * Get all teams for a specific event
   */
  getEventTeams: (eventId: number) => apiGET<Team[]>(`/boffmedia/events/${eventId}/teams`),
  
  /**
   * Get a specific team by ID
   */
  getTeam: (teamId: number) => apiGET<Team>(`/boffmedia/events/teams/${teamId}`),
  
  /**
   * Get team members
   */
  getTeamMembers: (teamId: number) => apiGET<TeamMember[]>(`/boffmedia/events/teams/${teamId}/members`),
  
  /**
   * Create a new team for an event
   */
  createTeam: (eventId: number, data: CreateTeamDto) => 
    apiPOST<Team>(`/boffmedia/events/${eventId}/teams`, data),
  
  /**
   * Update an existing team
   */
  updateTeam: (eventId: number, teamId: number, data: UpdateTeamDto) => 
    apiPATCH<Team>(`/boffmedia/events/${eventId}/teams/${teamId}`, data),
  
  /**
   * Join a team
   */
  joinTeam: (eventId: number, teamId: number, data: JoinTeamDto) => 
    apiPOST<SuccessResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/join`, data),
  
  /**
   * Leave a team
   */
  leaveTeam: (eventId: number, teamId: number, userId: number) => 
    apiDELETE<SuccessResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/members/${userId}`),

  // ==================== PARTICIPANT OPERATIONS ====================
  
  /**
   * Join an event
   */
  joinEvent: (eventId: number, data: any) => 
    apiPOST<SuccessResponse>(`/boffmedia/events/${eventId}/join`, data),
  
  /**
   * Get all participants for an event
   */
  getEventParticipants: (eventId: number) => 
    apiGET<Participant[]>(`/boffmedia/events/${eventId}/participants`),

  // ==================== PROGRESS OPERATIONS ====================
  
  /**
   * Get all achievement progress for a participant
   */
  getParticipantProgress: (participantId: number) => 
    apiGET<AchievementWithProgress[]>(`/boffmedia/events/participants/${participantId}/progress`),
  
  /**
   * Get achievement progress for a participant in a specific event
   */
  getParticipantProgressByEvent: (eventId: number, participantId: number) => 
    apiGET<AchievementWithProgress[]>(`/boffmedia/events/${eventId}/participants/${participantId}/progress`),
  
  /**
   * Update progress for an achievement
   */
  updateProgress: (eventId: number, data: UpdateProgressDto) => 
    apiPUT<SuccessResponse>(`/boffmedia/events/${eventId}/progress`, data),

  // ==================== LEADERBOARD OPERATIONS ====================
  
  /**
   * Get all leaderboards
   */
  getLeaderboards: () => apiGET<LeaderboardEntry[]>('/boffmedia/events/leaderboards'),
  
  /**
   * Get event leaderboard
   */
  getLeaderboard: (eventId: number) => 
    apiGET<LeaderboardEntry[]>(`/boffmedia/events/${eventId}/leaderboard`),
  
  /**
   * Get team leaderboard for an event
   */
  getTeamLeaderboard: (eventId: number) => 
    apiGET<TeamLeaderboardEntry[]>(`/boffmedia/events/${eventId}/teams/leaderboard`),

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Get event with achievements
   */
  getEventWithAchievements: async (eventId: number) => {
    const [event, achievements] = await Promise.all([
      eventsService.getEvent(eventId),
      eventsService.getEventAchievements(eventId)
    ]);
    return { event, achievements };
  },
  
  /**
   * Get event with teams and participants
   */
  getEventDetails: async (eventId: number) => {
    const [event, teams, participants] = await Promise.all([
      eventsService.getEvent(eventId),
      eventsService.getEventTeams(eventId),
      eventsService.getEventParticipants(eventId)
    ]);
    return { event, teams, participants };
  },
  
  /**
   * Get full leaderboard data for an event
   */
  getEventLeaderboards: async (eventId: number) => {
    const [participantLeaderboard, teamLeaderboard] = await Promise.all([
      eventsService.getLeaderboard(eventId),
      eventsService.getTeamLeaderboard(eventId)
    ]);
    return { participantLeaderboard, teamLeaderboard };
  },
  
  /**
   * Get participant's complete event data
   */
  getParticipantEventData: async (eventId: number, participantId: number) => {
    const [progress, event, achievements] = await Promise.all([
      eventsService.getParticipantProgressByEvent(eventId, participantId),
      eventsService.getEvent(eventId),
      eventsService.getEventAchievements(eventId)
    ]);
    return { progress, event, achievements };
  },

  // ==================== LEGACY METHODS ====================
  
  /**
   * Legacy method: Create event (alias)
   */
  createNewEvent: (data: CreateEventDto) => eventsService.createEvent(data),
  
  /**
   * Legacy method: Update event (alias)
   */
  updateEventData: (id: number, data: UpdateEventDto) => eventsService.updateEvent(id, data),
  
  /**
   * Legacy method: Get user progress (alias)
   */
  getUserProgress: (participantId: number) => eventsService.getParticipantProgress(participantId),
};