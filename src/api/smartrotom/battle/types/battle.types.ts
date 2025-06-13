// ==================== BASE TYPES ====================
export interface BaseBattleReplay {
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

export interface BaseBattleUserReplay {
  uuid: string;
  replayId: number;
  side: number;
}

export interface BaseBattleConfig {
  name?: string;
  description?: string;
  difficulty?: string;
  pokemon?: any[];
  rewards?: any[];
  [key: string]: any;
}

// ==================== REQUEST TYPES ====================
export interface GetUserReplaysRequest {
  uuid: string;
}

export interface GetReplayByIdRequest {
  replayId: number;
  uuid?: string;
}

export interface CreateReplayRequest {
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  userUuid: string;
}

export interface UpdateReplayRequest {
  replayId: number;
  team1?: string;
  team2?: string;
  replay?: string;
  winner?: string;
  side1?: string;
  side2?: string;
  uuid?: string;
}

export interface DeleteReplayRequest {
  replayId: number;
  uuid?: string;
}

export interface ShareReplayRequest {
  replayId: number;
  targetUuid: string;
  sourceUuid?: string;
}

export interface GetBattleConfigRequest {
  npcConfigName: string;
}

export interface CreateBattleConfigRequest {
  npcConfigName: string;
  config: BattleConfig;
}

export interface UpdateBattleConfigRequest {
  npcConfigName: string;
  config: Partial<BattleConfig>;
}

export interface DeleteBattleConfigRequest {
  npcConfigName: string;
}

export interface ValidateBattleConfigRequest {
  npcConfigName: string;
}

// ==================== RESPONSE TYPES ====================
export interface BattleReplayResponse {
  id: number;
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  date: Date;
}

export interface CreateReplayResponse extends BattleReplayResponse {}

export interface UpdateReplayResponse extends BattleReplayResponse {}

export interface DeleteReplayResponse {
  success: boolean;
  message: string;
}

export interface ShareReplayResponse {
  success: boolean;
  message: string;
}

export interface BattleConfigResponse extends BaseBattleConfig {}

export interface CreateBattleConfigResponse {
  success: boolean;
  message: string;
}

export interface UpdateBattleConfigResponse extends BaseBattleConfig {}

export interface DeleteBattleConfigResponse {
  success: boolean;
  message: string;
}

export interface GetAllBattleConfigsResponse {
  configs: string[];
}

export interface ValidateBattleConfigResponse {
  exists: boolean;
  valid: boolean;
}

// ==================== INTERNAL TYPES ====================
export interface ReplayData {
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
}

export interface UserReplayData {
  uuid: string;
  replayId: number;
  side?: number;
}

export interface ReplayUpdateData {
  team1?: string;
  team2?: string;
  replay?: string;
  winner?: string;
  side1?: string;
  side2?: string;
}

// ==================== TYPE ALIASES ====================
export type BattleReplay = BattleReplayResponse;
export type BattleConfig = BaseBattleConfig;

// ==================== DTO TYPES ====================
export interface CreateReplayDto {
  team1: string;
  team2: string;
  replay: string;
  winner: string;
  side1: string;
  side2: string;
  userUuid: string;
}

export interface UpdateReplayDto {
  team1?: string;
  team2?: string;
  replay?: string;
  winner?: string;
  side1?: string;
  side2?: string;
}

export interface ShareReplayDto {
  targetUuid: string;
  sourceUuid?: string;
}

export interface CreateBattleConfigDto extends BaseBattleConfig {}

export interface UpdateBattleConfigDto extends Partial<BaseBattleConfig> {}