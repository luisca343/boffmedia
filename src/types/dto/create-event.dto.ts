export interface CreateEventDto {
    title: string
    description: string
    gameId: number
    startDate: string
    endDate: string
    type: "event" | "server"
  }