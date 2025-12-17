import { Injectable, Inject } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository } from '../repositories/interfaces/millionaire.repository.interface';

export interface GameStateSnapshot {
  eventId: number;
  currentQuestion: number;
  lifelines: Record<string, boolean>;
  questionData?: any;
  playerAnswer?: number;
}

@Injectable()
export class GameStateService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async saveState(
    eventId: number,
    stateType: string,
    stateData: any,
    actorUuid?: string
  ): Promise<void> {
    await this.millionaireRepository.saveEventState({
      eventId,
      stateType,
      stateData,
      actorUuid
    });
  }

  async getLatestState(eventId: number): Promise<GameStateSnapshot | null> {
    const state = await this.millionaireRepository.getLatestEventState(eventId);
    if (!state) return null;

    return JSON.parse(state.stateData);
  }

  async recordAnswer(
    eventId: number,
    questionId: number,
    playerUuid: string,
    answerIndex: number,
    isCorrect: boolean
  ): Promise<void> {
    await this.millionaireRepository.saveAnswer({
      eventId,
      questionId,
      playerUuid,
      answerIndex,
      isCorrect
    });
  }
}
