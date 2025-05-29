import { type ApiResponse, apiGET, apiPOST, apiDELETE, apiPUT, apiPATCH } from "@/services/boffAPI"
import { CreateEventDto } from "@/types/dto/create-event.dto"
import { CreateGameDto } from "@/types/dto/create-game.dto"
import { CreateAchievementDto } from "@/types/dto/create-achievement.dto"
import { CreateTeamDto } from "@/types/dto/create-team.dto"
import { UpdateProgressDto } from "@/types/dto/update-progress.dto"
import { Event, Achievement, EventTeam, Game, LeaderboardEntry, TeamLeaderboardEntry, UserProgress } from "@/types/events"
import { SuccessResponse } from "@/types"

interface JoinEventDto {
  userId: number;
  nickname?: string;
  avatar?: string;
  comment?: string;
}

// Add EventParticipant interface if not defined elsewhere
interface EventParticipant {
  id: number;
  eventId: number;
  userId: number;
  nickname?: string;
  avatar?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export const eventsService = {
  // Event Management
  getEvents: () => apiGET<Event[]>("/boffmedia/events"),
  getEvent: (id: number) => apiGET<Event>(`/boffmedia/events/event/${id}`),
  createEvent: (createEventDto: CreateEventDto) => apiPOST<Event>("/boffmedia/events/event", createEventDto),
  updateEvent: (id: number, createEventDto: CreateEventDto) => apiPATCH<ApiResponse>(`/boffmedia/events/event/${id}`, createEventDto),

  // Event Participation
  joinEvent: (eventId: number, joinEventDto: JoinEventDto) => apiPOST<ApiResponse>(`/boffmedia/events/${eventId}/join`, joinEventDto),
  getEventParticipants: (eventId: number) => apiGET<EventParticipant[]>(`/boffmedia/events/${eventId}/participants`),

  // Game Management
  getGames: () => apiGET<Game[]>("/boffmedia/events/games"),
  getGame: (id: number) => apiGET<Game>(`/boffmedia/events/games/${id}`),
  createGame: (game: CreateGameDto) => apiPOST<SuccessResponse>("/boffmedia/events/games", game),
  updateGame: (id: number, game: Game) => apiPATCH<CreateGameDto>(`/boffmedia/events/games/${id}`, game),

  // Team Management
  getTeams: () => apiGET<EventTeam[]>("/boffmedia/events/teams"),
  createTeam: (eventId: number, createTeamDto: CreateTeamDto) => apiPOST<EventTeam>(`/boffmedia/events/${eventId}/teams`, createTeamDto),
  updateTeam: (eventId: number, teamId: number, createTeamDto: CreateTeamDto) => apiPATCH<ApiResponse>(`/boffmedia/events/${eventId}/teams/${teamId}`, createTeamDto),
  getEventTeams: (eventId: number) => apiGET<EventTeam[]>(`/boffmedia/events/${eventId}/teams`),
  joinTeam: (eventId: number, teamId: number, participantId: number) => apiPOST<ApiResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/join`, { participantId }),
  leaveTeam: (eventId: number, teamId: number, participantId: number) => apiDELETE<ApiResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/members/${participantId}`),

  // Achievement Management
  getAchievements: () => apiGET<Achievement[]>("/boffmedia/events/achievements"),
  createAchievement: (eventId: number, createAchievementDto: CreateAchievementDto) => apiPOST<Achievement>(`/boffmedia/events/${eventId}/achievements`, createAchievementDto),
  updateAchievement: (eventId: number, achievementId: number, createAchievementDto: CreateAchievementDto) => apiPATCH<ApiResponse>(`/boffmedia/events/${eventId}/achievements/${achievementId}`, createAchievementDto),
  getEventAchievements: (eventId: number) => apiGET<Achievement[]>(`/boffmedia/events/${eventId}/achievements`),
  updateProgress: (eventId: number, updateProgressDto: UpdateProgressDto) => apiPATCH<ApiResponse>(`/boffmedia/events/${eventId}/progress`, updateProgressDto),

  // Progress Management
  getParticipantProgress: (participantId: number) => apiGET<UserProgress[]>(`/boffmedia/events/participants/${participantId}/progress`),
  getParticipantProgressByEvent: (eventId: number, participantId: number) => apiGET<UserProgress[]>(`/boffmedia/events/${eventId}/participants/${participantId}/progress`),

  // Leaderboards
  getLeaderboards: () => apiGET<LeaderboardEntry[]>("/boffmedia/events/leaderboards"),
  getLeaderboard: (eventId: number) => apiGET<LeaderboardEntry[]>(`/boffmedia/events/${eventId}/leaderboard`),
  getTeamLeaderboard: (eventId: number) => apiGET<TeamLeaderboardEntry[]>(`/boffmedia/events/${eventId}/teams/leaderboard`),
}