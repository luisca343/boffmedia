export interface CreateMedalDto {
    name: string
    description: string
    icon: string
    points: number
    category: "placement" | "challenge" | "participation" | "team_achievement"
    placement?: number
    maxProgress: number
    order: number
    isTeamMedal: boolean
  }