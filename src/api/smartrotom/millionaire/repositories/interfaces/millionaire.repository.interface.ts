export interface SessionData {
  conductorUuid: string;
}

export interface SessionWithPlayers {
  session: any;
  players: any[];
  currentQuestion?: any;
}

export interface LifelineResult {
  type: string;
  data: any;
}

export interface IMillionaireRepository {
  // Session operations
  createSession(data: SessionData): Promise<{ sessionId: number; sessionCode: string }>;
  findSessionByCode(sessionCode: string): Promise<any | null>;
  findSessionById(sessionId: number): Promise<any | null>;
  updateSessionStatus(sessionId: number, status: string): Promise<boolean>;
  advanceQuestion(sessionId: number): Promise<boolean>;
  
  // Player operations
  addPlayer(sessionId: number, uuid: string, name: string): Promise<number>;
  updatePlayerConnection(playerId: number, status: string): Promise<boolean>;
  findPlayerByUuid(sessionId: number, uuid: string): Promise<any | null>;
  
  // Question operations
  findQuestionsByDifficulty(difficultyLevel: number): Promise<any[]>;
  getRandomQuestionForLevel(level: number): Promise<any | null>;
  
  // Game state operations
  saveGameState(data: any): Promise<number>;
  getLatestGameState(sessionId: number): Promise<any | null>;
  
  // Answer operations
  saveAnswer(data: any): Promise<number>;
  
  // Lifeline operations
  useLifeline(sessionId: number, lifelineType: string): Promise<boolean>;
  getLifelineResult(sessionId: number, questionId: number, lifelineType: string): Promise<LifelineResult>;
}
