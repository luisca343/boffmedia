// Types below have no exact equivalent in @boffmedia/shared yet.
// Event, Achievement, Game, LeaderboardEntry have been migrated to @boffmedia/shared.

// EventTeam includes `eventName` which is not present in the shared Team type.
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

export interface EventParticipant {
  userId: number
  eventId: number
  comment: string | null
  createdAt: Date
  updatedAt: Date
}

// UserProgress rows returned by the progress endpoint (not the same shape as AchievementWithProgress).
export interface UserProgress {
  participantId: number
  achievementId: number
  currentProgress: number
  isCompleted: number // 0 or 1 since it&#39;s an int in MySQL
  completedAt: Date | null
  lastUpdated: Date
  createdAt: Date
}

