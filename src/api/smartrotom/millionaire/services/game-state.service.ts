import { Injectable, Inject } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository } from '../repositories/interfaces/millionaire.repository.interface';

export interface GameStateSnapshot {
  sessionId: number;
  currentQuestion: number;
  prizeMoney: string;
  lifelines: Record<string, boolean>;
  questionData?: any;
  playerAnswer?: number;
  timeRemaining?: number;
}

@Injectable()
export class GameStateService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async saveState(
    sessionId: number,
    questionNumber: number,
    questionId: number,
    snapshot: GameStateSnapshot,
    options?: {
      playerAnswer?: number;
      isCorrect?: boolean;
      timeSpent?: number;
      lifelineUsed?: string;
    }
  ): Promise<void> {
    await this.millionaireRepository.saveGameState({
      sessionId,
      questionNumber,
      questionId,
      playerAnswer: options?.playerAnswer,
      isCorrect: options?.isCorrect,
      timeSpent: options?.timeSpent,
      lifelineUsed: options?.lifelineUsed,
      stateSnapshot: JSON.stringify(snapshot)
    });
  }

  async getLatestState(sessionId: number): Promise<GameStateSnapshot | null> {
    const state = await this.millionaireRepository.getLatestGameState(sessionId);
    if (!state) return null;

    return JSON.parse(state.stateSnapshot);
  }

  async recordAnswer(
    sessionId: number,
    questionId: number,
    playerUuid: string,
    answerIndex: number,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    await this.millionaireRepository.saveAnswer({
      sessionId,
      questionId,
      playerUuid,
      answerIndex,
      isCorrect,
      timeSpent
    });
  }
}
