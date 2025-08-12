export interface Event {
  id: number
  parentId: number
  title: string
  gameId: number
  gameName: string
  description: string | null
  icon: string
  banner: string | null
  startDate: string
  endDate: string
  status: "upcoming" | "active" | "completed"
  visibility: "public" | "private"
  type: "event" | "server"
  createdAt: string
  updatedAt: string
}

// Team types
export interface EventTeam {
  id: number
  eventId: number
  eventName: string
  name: string
  tag: string | null
  icon: string | null
  totalScore: number
  createdAt: Date
  updatedAt: Date
}

export interface EventTeamMember {
  teamId: number
  userId: number
  role: "leader" | "member"
  joinedAt: Date
  updatedAt: Date
}

// Achievement type
export interface Achievement {
  id: number
  eventId: number
  eventName: string
  name: string
  description: string | null
  icon: string
  maxProgress: number
  points: number
  itemType: "achievement" | "medal"
  category: "competition" | "challenge" | "participation" | "achievement"
  rarity: "bronze" | "silver" | "gold" | "platinum" | "diamond" | null
  order: number
  createdAt: Date
  updatedAt: Date
}

// Additional related types
export interface EventParticipant {
  userId: number
  eventId: number
  comment: string | null
  createdAt: Date
  updatedAt: Date
}

// Updated UserProgress to match your database schema
export interface UserProgress {
  participantId: number
  achievementId: number
  currentProgress: number
  isCompleted: number // 0 or 1 since it's an int in MySQL
  completedAt: Date | null
  lastUpdated: Date
  createdAt: Date
}

export interface PointsHistory {
  id: number
  userId: number
  eventId: number
  teamId: number | null
  achievementId: number
  pointsAwarded: number
  reason: string
  metadata: string | null
  awardedAt: Date
  createdAt: Date
}

export interface Game {
  id: number
  title: string
  description: string
  icon: string
  createdAt: Date
  updatedAt: Date
}

export type LeaderboardEntry = {
  userId: number
  nickname: string
  achievementPoints: number
  medalPoints: number
  totalPoints: number
  achievementCount: number
  medalCount: number
}

export type TeamLeaderboardEntry = {
  teamId: number
  teamName: string
  teamTag: string | null
  score: number
  memberCount: number
}