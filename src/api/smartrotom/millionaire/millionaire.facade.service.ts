import { Injectable } from '@nestjs/common';
import { EventService } from './services/event.service';
import { QuestionService } from './services/question.service';
import { GameStateService } from './services/game-state.service';
import { LifelineService } from './services/lifeline.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { UseLifelineDto } from './dto/use-lifeline.dto';

export interface GameStateResponse {
  event: any;
  millionaireData: any;
  currentQuestion?: any;
  lifelines: Record<string, boolean>;
  status: string;
}

@Injectable()
export class MillionaireFacadeService {
  constructor(
    private readonly eventService: EventService,
    private readonly questionService: QuestionService,
    private readonly gameStateService: GameStateService,
    private readonly lifelineService: LifelineService,
  ) {}

  async createEvent(conductorUuid: string, title?: string, description?: string, maxParticipants?: number): Promise<{ eventId: number; eventCode: string }> {
    return await this.eventService.createEvent(conductorUuid, title, description, maxParticipants);
  }

  async getEvent(eventId: number): Promise<any> {
    return await this.eventService.getEvent(eventId);
  }

  async getEventByCode(eventCode: string): Promise<any> {
    return await this.eventService.getEventByCode(eventCode);
  }

  async joinEvent(eventCode: string, playerUuid: string): Promise<number> {
    const event = await this.eventService.getEventByCode(eventCode);
    return await this.eventService.addParticipant(event.id, playerUuid, 'PARTICIPANT');
  }

  async updateEventStatus(eventId: number, status: string): Promise<void> {
    await this.eventService.updateStatus(eventId, status);
  }

  async startGame(eventId: number): Promise<void> {
    await this.eventService.updateStatus(eventId, 'ACTIVE');
    
    const question = await this.questionService.getQuestionForLevel(1);
    
    const snapshot = {
      eventId,
      currentQuestion: 1,
      lifelines: { '50:50': true, 'phone': true, 'audience': true },
      questionData: question
    };
    
    await this.gameStateService.saveState(
      eventId,
      'GAME_STARTED',
      snapshot
    );
  }

  async revealNextQuestion(eventId: number): Promise<any> {
    const event = await this.eventService.getEvent(eventId);
    const millData = event.millionaireData;
    
    const nextLevel = millData.currentQuestion + 1;
    if (nextLevel > 15) {
      await this.eventService.updateStatus(eventId, 'COMPLETED');
      return null;
    }
    
    await this.eventService.advanceToNextQuestion(eventId);
    const question = await this.questionService.getQuestionForLevel(nextLevel);
    
    const snapshot = {
      eventId,
      currentQuestion: nextLevel,
      lifelines: millData.lifelinesRemaining,
      questionData: question
    };
    
    await this.gameStateService.saveState(
      eventId,
      'QUESTION_REVEALED',
      snapshot
    );
    
    return question;
  }

  async submitAnswer(submitAnswerDto: SubmitAnswerDto): Promise<{ isCorrect: boolean }> {
    const { eventId, playerUuid, answerIndex } = submitAnswerDto;
    
    const event = await this.eventService.getEvent(eventId);
    const millData = event.millionaireData;
    
    if (event.status !== 'ACTIVE') {
      throw new Error('Event is not active');
    }
    
    const currentLevel = millData.currentQuestion;
    const question = await this.questionService.getQuestionForLevel(currentLevel);
    
    const isCorrect = await this.questionService.validateAnswer(question.id, answerIndex);
    
    await this.gameStateService.recordAnswer(
      eventId,
      question.id,
      playerUuid,
      answerIndex,
      isCorrect
    );
    
    await this.gameStateService.saveState(
      eventId,
      'ANSWER_SUBMITTED',
      {
        eventId,
        questionId: question.id,
        playerUuid,
        answerIndex,
        isCorrect,
        currentQuestion: currentLevel
      },
      playerUuid
    );
    
    if (!isCorrect) {
      await this.eventService.updateStatus(eventId, 'COMPLETED');
    }
    
    return { isCorrect };
  }

  async useLifeline(useLifelineDto: UseLifelineDto): Promise<any> {
    const { eventId, playerUuid, lifelineType } = useLifelineDto;
    
    const event = await this.eventService.getEvent(eventId);
    const millData = event.millionaireData;
    
    const currentLevel = millData.currentQuestion;
    const question = await this.questionService.getQuestionForLevel(currentLevel);
    
    const result = await this.lifelineService.useLifeline(
      eventId,
      question.id,
      lifelineType
    );
    
    await this.gameStateService.saveState(
      eventId,
      'LIFELINE_USED',
      {
        eventId,
        lifelineType,
        result,
        currentQuestion: currentLevel
      },
      playerUuid
    );
    
    return result;
  }

  async getCurrentState(eventId: number): Promise<GameStateResponse> {
    const event = await this.eventService.getEvent(eventId);
    const millData = event.millionaireData;
    const latestState = await this.gameStateService.getLatestState(eventId);
    
    return {
      event,
      millionaireData: millData,
      currentQuestion: latestState?.questionData,
      lifelines: millData?.lifelinesRemaining || {},
      status: event.status
    };
  }
}
