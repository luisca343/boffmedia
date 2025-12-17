import { Injectable } from '@nestjs/common';
import { SessionService } from './services/session.service';
import { QuestionService } from './services/question.service';
import { GameStateService } from './services/game-state.service';
import { LifelineService } from './services/lifeline.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { UseLifelineDto } from './dto/use-lifeline.dto';

export interface GameStateResponse {
  session: any;
  currentQuestion?: any;
  lifelines: Record<string, boolean>;
  status: string;
}

@Injectable()
export class MillionaireFacadeService {
  constructor(
    private readonly sessionService: SessionService,
    private readonly questionService: QuestionService,
    private readonly gameStateService: GameStateService,
    private readonly lifelineService: LifelineService,
  ) {}

  async createSession(conductorUuid: string): Promise<{ sessionId: number; sessionCode: string }> {
    return await this.sessionService.createSession(conductorUuid);
  }

  async getSession(sessionId: number): Promise<any> {
    return await this.sessionService.getSession(sessionId);
  }

  async getSessionByCode(sessionCode: string): Promise<any> {
    return await this.sessionService.getSessionByCode(sessionCode);
  }

  async joinSession(sessionCode: string, playerUuid: string, playerName: string): Promise<number> {
    const session = await this.sessionService.getSessionByCode(sessionCode);
    return await this.sessionService.addPlayer(session.id, playerUuid, playerName);
  }

  async updateSessionStatus(sessionId: number, status: string): Promise<void> {
    await this.sessionService.updateStatus(sessionId, status);
  }

  async startGame(sessionId: number): Promise<void> {
    await this.sessionService.updateStatus(sessionId, 'ACTIVE');
    
    const question = await this.questionService.getQuestionForLevel(1);
    
    const snapshot = {
      sessionId,
      currentQuestion: 0,
      lifelines: { '50:50': true, 'phone': true, 'audience': true },
      questionData: question
    };
    
    await this.gameStateService.saveState(sessionId, 1, question.id, snapshot);
  }

  async revealNextQuestion(sessionId: number): Promise<any> {
    const session = await this.sessionService.getSession(sessionId);
    const nextLevel = session.currentQuestion + 1;

    if (nextLevel > 15) {
      throw new Error('Game completed - all questions answered');
    }

    const question = await this.questionService.getQuestionForLevel(nextLevel);
    await this.sessionService.advanceToNextQuestion(sessionId);

    return await this.questionService.getQuestionForPlayer(question.id);
  }

  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<{ isCorrect: boolean }> {
    const session = await this.sessionService.getSession(submitAnswerDto.sessionId);
    const latestState = await this.gameStateService.getLatestState(submitAnswerDto.sessionId);
    
    if (!latestState?.questionData) {
      throw new Error('No active question');
    }

    const isCorrect = await this.questionService.validateAnswer(
      latestState.questionData.id,
      submitAnswerDto.answerIndex
    );

    await this.gameStateService.recordAnswer(
      submitAnswerDto.sessionId,
      latestState.questionData.id,
      submitAnswerDto.playerUuid,
      submitAnswerDto.answerIndex,
      isCorrect
    );

    await this.gameStateService.saveState(
      submitAnswerDto.sessionId,
      session.currentQuestion,
      latestState.questionData.id,
      {
        ...latestState,
        playerAnswer: submitAnswerDto.answerIndex
      },
      {
        playerAnswer: submitAnswerDto.answerIndex,
        isCorrect
      }
    );

    return {
      isCorrect
    };
  }

  async useLifeline(useLifelineDto: UseLifelineDto): Promise<any> {
    const latestState = await this.gameStateService.getLatestState(useLifelineDto.sessionId);
    
    if (!latestState?.questionData) {
      throw new Error('No active question');
    }

    const result = await this.lifelineService.useLifeline(
      useLifelineDto.sessionId,
      latestState.questionData.id,
      useLifelineDto.lifelineType
    );

    await this.gameStateService.saveState(
      useLifelineDto.sessionId,
      latestState.currentQuestion,
      latestState.questionData.id,
      latestState,
      {
        lifelineUsed: useLifelineDto.lifelineType
      }
    );

    return result;
  }

  async getCurrentState(sessionId: number): Promise<GameStateResponse> {
    const session = await this.sessionService.getSession(sessionId);
    const latestState = await this.gameStateService.getLatestState(sessionId);

    return {
      session: {
        id: session.id,
        sessionCode: session.sessionCode,
        currentQuestion: session.currentQuestion,
        status: session.status
      },
      currentQuestion: latestState?.questionData,
      lifelines: session.lifelinesRemaining,
      status: session.status
    };
  }
}
