export interface CreateEventDto {
    title: string
    description: string
    icon?: string
    banner?: string
    gameId: number
    startDate: string
    endDate?: string
    type: "event" | "server"
  }