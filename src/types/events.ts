export interface Event {
    id: number
    title: string
    game: number
    description: string | null
    startDate: Date
    endDate: Date
    type: "event" | "server"
  }
  
  // Team types
  export interface EventTeam {
    id: number
    eventId: number
    name: string
    tag: string | null
    icon: string | null
    leaderId: number
    createdAt: Date
    totalScore: number
  }
  
  export interface EventTeamMember {
    teamId: number
    userId: number
    role: "leader" | "member"
    joinedAt: Date
  }
  
  // Medal type
  export interface EventMedal {
    id: number
    eventId: number
    name: string
    description: string | null
    icon: string
    points: number
    category: "placement" | "challenge" | "participation"
    placement: number | null
    maxProgress: number
    order: number
    createdAt: Date
  }
  
  // Additional related types
  export interface EventParticipant {
    userId: number
    eventId: number
    comment: string | null
  }
  
  export interface EventChallenge {
    id: number
    eventId: number
    name: string
    description: string | null
    startDate: Date
    endDate: Date
    medalId: number
    maxProgress: number
    active: number
  }
  
  export interface EventMedalProgress {
    userId: number
    medalId: number
    currentProgress: number
    earned: number
    earnedAt: Date | null
    lastUpdated: Date
  }
  
  export interface Achievement {
    id: number
    title: string
    description: string | null
    icon: string
    eventId: number
    target: number
    rarity: "bronze" | "silver" | "gold" | "platinum" | "diamond"
    points: number
    createdAt: Date
    updatedAt: Date
  }
  
  export interface AchievementProgress {
    userId: number
    achievementId: number
    progress: number
    completed: number
    completedAt: Date | null
    lastUpdated: Date
  }
  