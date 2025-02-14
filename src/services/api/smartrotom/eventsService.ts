import { type ApiResponse, apiGET, apiPOST, apiDELETE, apiPUT } from "@/services/boffAPI"
import { CreateEventDto } from "@/types/dto/create-event.dto"
import { CreateMedalDto } from "@/types/dto/create-medal.dto"
import { CreateTeamDto } from "@/types/dto/create-team.dto"
import { UpdateProgressDto } from "@/types/dto/update-progress.dto"
import { Event, EventMedal, EventTeam } from "@/types/events"

export const eventsService = {
  // Event Management
  getEvents: () => apiGET<Event[]>("/boffmedia/events"),
  getEvent: (id: number) => apiGET<Event>(`/boffmedia/events/${id}`),
  createEvent: (createEventDto: CreateEventDto) => apiPOST<Event>("/boffmedia/events", createEventDto),

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

