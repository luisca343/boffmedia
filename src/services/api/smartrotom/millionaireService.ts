import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import type { 
  CreateSessionDto,
  JoinSessionDto,
  SubmitAnswerDto,
  UseLifelineDto,
  SessionEntity
} from '@/generated/api';

// Response types based on controller
export interface CreateSessionResponse {
  sessionId: number;
  sessionCode: string;
}

export interface JoinSessionResponse {
  playerId: number;
  sessionId: number;
}

export interface SubmitAnswerResponse {
  isCorrect: boolean;
}

export interface UseLifelineResponse {
  type: string;
  data: {
    removedAnswers?: number[];
    [key: string]: any;
  };
}

export interface GameStateResponse {
  [key: string]: any; // Based on facade implementation
}

export class MillionaireService {
  /**
   * Create a new game session (Conductor)
   */
  static createSession(createSessionDto: CreateSessionDto): Promise<ApiResponse<CreateSessionResponse>> {
    return rotomPOST<CreateSessionResponse>('/millionaire/session/create', createSessionDto);
  }

  /**
   * Join an existing session (Player)
   */
  static joinSession(joinSessionDto: JoinSessionDto): Promise<ApiResponse<JoinSessionResponse>> {
    return rotomPOST<JoinSessionResponse>('/millionaire/session/join', joinSessionDto);
  }

  /**
   * Get session details by ID
   */
  static getSession(sessionId: number): Promise<ApiResponse<SessionEntity>> {
    return rotomGET<SessionEntity>(`/millionaire/session/${sessionId}`);
  }

  /**
   * Get session by code
   */
  static getSessionByCode(code: string): Promise<ApiResponse<SessionEntity>> {
    return rotomGET<SessionEntity>(`/millionaire/session/code/${code}`);
  }

  /**
   * Start a game session (Conductor)
   */
  static startGame(sessionId: number): Promise<ApiResponse<{ success: boolean }>> {
    return rotomPOST<{ success: boolean }>('/millionaire/game/start', { sessionId });
  }

  /**
   * Submit answer to current question (Player)
   */
  static submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<ApiResponse<SubmitAnswerResponse>> {
    return rotomPOST<SubmitAnswerResponse>('/millionaire/answer/submit', submitAnswerDto);
  }

  /**
   * Use a lifeline (Player)
   */
  static useLifeline(useLifelineDto: UseLifelineDto): Promise<ApiResponse<UseLifelineResponse>> {
    return rotomPOST<UseLifelineResponse>('/millionaire/lifeline/use', useLifelineDto);
  }

  /**
   * Get current game state
   */
  static getGameState(sessionId: number): Promise<ApiResponse<GameStateResponse>> {
    return rotomGET<GameStateResponse>(`/millionaire/state/${sessionId}`);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Quick method to create session by conductor UUID only
   */
  static createSessionForConductor(conductorUuid: string): Promise<ApiResponse<CreateSessionResponse>> {
    return MillionaireService.createSession({ conductorUuid });
  }

  /**
   * Quick method to join session by code and player UUID
   */
  static joinSessionQuick(sessionCode: string, playerUuid: string): Promise<ApiResponse<JoinSessionResponse>> {
    return MillionaireService.joinSession({ sessionCode, playerUuid });
  }

  /**
   * Submit answer with all required fields
   */
  static answerQuestion(
    playerUuid: string,
    sessionId: number,
    answerIndex: number
  ): Promise<ApiResponse<SubmitAnswerResponse>> {
    return MillionaireService.submitAnswer({
      playerUuid,
      sessionId,
      answerIndex
    });
  }

  /**
   * Use a specific lifeline type
   */
  static requestLifeline(
    playerUuid: string,
    sessionId: number,
    lifelineType: UseLifelineDto['lifelineType']
  ): Promise<ApiResponse<UseLifelineResponse>> {
    return MillionaireService.useLifeline({
      playerUuid,
      sessionId,
      lifelineType
    });
  }
}

// Export types for convenience
export type { 
  CreateSessionDto,
  JoinSessionDto,
  SubmitAnswerDto,
  UseLifelineDto,
  SessionEntity,
  ApiResponse 
};
