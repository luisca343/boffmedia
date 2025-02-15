import { type ApiResponse, apiGET, apiPOST, apiDELETE, apiPUT, apiPATCH } from "@/services/boffAPI"
import { CreateEventDto } from "@/types/dto/create-event.dto"
import { CreateGameDto } from "@/types/dto/create-game.dto"
import { CreateMedalDto } from "@/types/dto/create-medal.dto"
import { CreateTeamDto } from "@/types/dto/create-team.dto"
import { UpdateProgressDto } from "@/types/dto/update-progress.dto"
import { Event, EventMedal, EventTeam, Game } from "@/types/events"
import { get } from "http"

export const eventsService = {
  // Event Management
  getEvents: () => apiGET<Event[]>("/boffmedia/events"),
  getEvent: (id: number) => apiGET<Event>(`/boffmedia/events/event/${id}`),
  createEvent: (createEventDto: CreateEventDto) => apiPOST<Event>("/boffmedia/events/event", createEventDto),

  // Game Management
  getGames: () => apiGET<Game[]>("/boffmedia/events/games"),
  getGame: (id: number) => apiGET<Game>(`/boffmedia/events/games/${id}`),
  createGame: (game: Game) => apiPOST<CreateGameDto>("/boffmedia/events/games", game),
  updateGame: (id: number, game: Game) => apiPATCH<CreateGameDto>(`/boffmedia/events/games/${id}`, game),

  // Team Management
  createTeam: (eventId: number, createTeamDto: CreateTeamDto) =>
    apiPOST<EventTeam>(`/boffmedia/events/${eventId}/teams`, createTeamDto),
  getEventTeams: (eventId: number) => apiGET<EventTeam[]>(`/boffmedia/events/${eventId}/teams`),
  joinTeam: (eventId: number, teamId: number, userId: number) =>
    apiPOST<ApiResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/join`, { userId }),
  leaveTeam: (eventId: number, teamId: number, userId: number) =>
    apiDELETE<ApiResponse>(`/boffmedia/events/${eventId}/teams/${teamId}/members/${userId}`),

  // Medal and Progress Management
  createMedal: (eventId: number, createMedalDto: CreateMedalDto) =>
    apiPOST<EventMedal>(`/boffmedia/events/${eventId}/medals`, createMedalDto),
  getEventMedals: (eventId: number) => apiGET<EventMedal[]>(`/boffmedia/events/${eventId}/medals`),
  updateProgress: (eventId: number, updateProgressDto: UpdateProgressDto) =>
    apiPUT<ApiResponse>(`/boffmedia/events/${eventId}/progress`, updateProgressDto),

  // Leaderboards
  getLeaderboard: (eventId: number) => apiGET<any[]>(`/boffmedia/events/${eventId}/leaderboard`),
  getTeamLeaderboard: (eventId: number) =>
    apiGET<any[]>(`/boffmedia/events/${eventId}/teams/leaderboard`),
}

