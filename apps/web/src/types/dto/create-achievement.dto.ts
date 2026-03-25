export interface CreateAchievementDto {
    title: string
    description: string
    icon: string
    target: number
    rarity: "bronze" | "silver" | "gold" | "platinum" | "diamond"
    points: number
  }