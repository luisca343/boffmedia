// ==================== BASE TYPES ====================
export interface BaseSmartRotomAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  subcategory: string;
  target: number;
  order: number;
}

export interface BaseSmartRotomReplay {
  id: number;
  side1: string;
  side2: string;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== REQUEST TYPES ====================
export interface GetUserAchievementsRequest {
  uuid: string;
}

export interface GetUserAchievementRequest {
  uuid: string;
  achievementId: string;
}

export interface BattleAchievementRequest {
  uuid: string;
  logro: string;
  name1: string;
  name2: string;
  team1: any;
  team2: any;
  replay: string;
  victoria: boolean;
}

export interface CreateReplayRequest {
  side1: string;
  side2: string;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
}

export interface CreateUserReplayRequest {
  replayId: number;
  uuid: string;
  side: number;
}

export interface CreateUserAchievementRequest {
  dataId: number;
  uuid: string;
  achievementId: string;
  progress: number;
  completed: number;
  completedAt: Date;
}

export interface GetUserReplayRequest {
  uuid: string;
  replayId: number;
}

// ==================== RESPONSE TYPES ====================
export interface AchievementDetailsResponse {
  id: string;
  battleId: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  subcategory: string;
  progress: number;
  completed: number;
  completedAt: Date;
  uuid: string;
  team: string;
  replay: string;
}

export interface UserAchievementStatusResponse {
  id: string;
  completed: number;
}

export interface ReplayDetailsResponse {
  id: number;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  date: Date;
}

export interface BattleAchievementResponse {
  success: boolean;
  error?: string;
}

export interface CreateReplayResponse {
  replayId: number;
}

export interface CreateUserReplayResponse {
  relationId: number;
}

export interface CreateUserAchievementResponse {
  insertId: number;
}

// ==================== INTERNAL TYPES ====================
export interface AchievementValidationResult {
  completed: number | null;
  error?: string;
}