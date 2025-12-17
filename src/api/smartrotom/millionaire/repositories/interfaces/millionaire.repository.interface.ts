export interface EventData {
  conductorUuid: string;
  title?: string;
  description?: string;
  maxParticipants?: number;
}

export interface EventWithData {
  event: any;
  millionaireData: any;
  participants?: any[];
  currentQuestion?: any;
}

export interface LifelineResult {
  type: string;
  data: any;
}

export interface IMillionaireRepository {
  // Event operations
  createEvent(data: EventData): Promise<{ eventId: number; eventCode: string }>;
  findEventByCode(eventCode: string): Promise<any | null>;
  findEventById(eventId: number): Promise<any | null>;
  updateEventStatus(eventId: number, status: string): Promise<boolean>;
  
  // Millionaire data operations
  createMillionaireData(eventId: number): Promise<number>;
  findMillionaireData(eventId: number): Promise<any | null>;
  advanceQuestion(eventId: number): Promise<boolean>;
  updateLifelines(eventId: number, lifelines: Record<string, boolean>): Promise<boolean>;
  
  // Participant operations
  addParticipant(eventId: number, uuid: string, role: string): Promise<number>;
  updateParticipantConnection(participantId: number, status: string): Promise<boolean>;
  findParticipantByUuid(eventId: number, uuid: string): Promise<any | null>;
  getEventParticipants(eventId: number): Promise<any[]>;
  
  // Question operations
  findQuestionsByDifficulty(difficultyLevel: number): Promise<any[]>;
  getRandomQuestionForLevel(level: number): Promise<any | null>;
  
  // Event state operations
  saveEventState(data: any): Promise<number>;
  getLatestEventState(eventId: number): Promise<any | null>;
  
  // Answer operations
  saveAnswer(data: any): Promise<number>;
  
  // Lifeline operations
  useLifeline(eventId: number, lifelineType: string): Promise<boolean>;
  getLifelineResult(eventId: number, questionId: number, lifelineType: string): Promise<LifelineResult>;
}

