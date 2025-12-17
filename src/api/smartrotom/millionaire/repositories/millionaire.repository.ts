import { Injectable, Inject } from '@nestjs/common';
import { eq, and, sql as drizzleSql } from 'drizzle-orm';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  millionaireQuestions,
  millionaireAnswers,
  millionaireEventData,
} from '@/_db/schema/SmartRotomMillionaire';
import {
  rotomEvents,
  rotomEventParticipants,
  rotomEventStates,
} from '@/_db/schema/SmartRotomEvents';
import { 
  IMillionaireRepository, 
  EventData, 
  LifelineResult 
} from './interfaces/millionaire.repository.interface';

@Injectable()
export class MillionaireRepository implements IMillionaireRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== EVENT OPERATIONS ====================

  async createEvent(data: EventData): Promise<{ eventId: number; eventCode: string }> {
    const eventCode = this.generateEventCode();
    
    const result = await this.db.insert(rotomEvents).values({
      eventCode,
      eventType: 'MILLIONAIRE',
      title: data.title || 'Millionaire Game',
      description: data.description,
      conductorUuid: data.conductorUuid,
      status: 'WAITING',
      maxParticipants: data.maxParticipants,
    });

    const eventId = Number(result[0].insertId);

    // Create millionaire-specific data
    await this.createMillionaireData(eventId);

    // Add conductor as participant
    await this.addParticipant(eventId, data.conductorUuid, 'CONDUCTOR');

    return { eventId, eventCode };
  }

  async findEventByCode(eventCode: string): Promise<any | null> {
    const result = await this.db
      .select()
      .from(rotomEvents)
      .where(eq(rotomEvents.eventCode, eventCode))
      .limit(1);

    return result[0] || null;
  }

  async findEventById(eventId: number): Promise<any | null> {
    const result = await this.db
      .select()
      .from(rotomEvents)
      .where(eq(rotomEvents.id, eventId))
      .limit(1);

    return result[0] || null;
  }

  async updateEventStatus(eventId: number, status: string): Promise<boolean> {
    const result = await this.db
      .update(rotomEvents)
      .set({ 
        status: status as any,
        ...(status === 'ACTIVE' ? { startedAt: new Date() } : {}),
        ...(status === 'COMPLETED' || status === 'CANCELLED' ? { completedAt: new Date() } : {})
      })
      .where(eq(rotomEvents.id, eventId));

    return result[0].affectedRows > 0;
  }

  // ==================== MILLIONAIRE DATA OPERATIONS ====================

  async createMillionaireData(eventId: number): Promise<number> {
    const result = await this.db.insert(millionaireEventData).values({
      eventId,
      currentQuestion: 0,
      lifelinesRemaining: '{"50:50":true,"phone":true,"audience":true}',
      prizePool: 1000000,
      currentPrize: 0,
    });

    return Number(result[0].insertId);
  }

  async findMillionaireData(eventId: number): Promise<any | null> {
    const result = await this.db
      .select()
      .from(millionaireEventData)
      .where(eq(millionaireEventData.eventId, eventId))
      .limit(1);

    return result[0] || null;
  }

  async advanceQuestion(eventId: number): Promise<boolean> {
    const result = await this.db
      .update(millionaireEventData)
      .set({ 
        currentQuestion: drizzleSql`${millionaireEventData.currentQuestion} + 1` 
      })
      .where(eq(millionaireEventData.eventId, eventId));

    return result[0].affectedRows > 0;
  }

  async updateLifelines(eventId: number, lifelines: Record<string, boolean>): Promise<boolean> {
    const result = await this.db
      .update(millionaireEventData)
      .set({ lifelinesRemaining: JSON.stringify(lifelines) })
      .where(eq(millionaireEventData.eventId, eventId));

    return result[0].affectedRows > 0;
  }

  // ==================== PARTICIPANT OPERATIONS ====================

  async addParticipant(eventId: number, uuid: string, role: string): Promise<number> {
    const result = await this.db.insert(rotomEventParticipants).values({
      eventId,
      userUuid: uuid,
      role: role as any,
      connectionStatus: 'CONNECTED',
    });

    return Number(result[0].insertId);
  }

  async updateParticipantConnection(participantId: number, status: string): Promise<boolean> {
    const result = await this.db
      .update(rotomEventParticipants)
      .set({ 
        connectionStatus: status as any,
        lastHeartbeat: new Date(),
        ...(status === 'DISCONNECTED' ? { leftAt: new Date() } : {})
      })
      .where(eq(rotomEventParticipants.id, participantId));

    return result[0].affectedRows > 0;
  }

  async findParticipantByUuid(eventId: number, uuid: string): Promise<any | null> {
    const result = await this.db
      .select()
      .from(rotomEventParticipants)
      .where(
        and(
          eq(rotomEventParticipants.eventId, eventId),
          eq(rotomEventParticipants.userUuid, uuid)
        )
      )
      .limit(1);

    return result[0] || null;
  }

  async getEventParticipants(eventId: number): Promise<any[]> {
    return await this.db
      .select()
      .from(rotomEventParticipants)
      .where(eq(rotomEventParticipants.eventId, eventId));
  }

  // ==================== QUESTION OPERATIONS ====================

  async findQuestionsByDifficulty(difficultyLevel: number): Promise<any[]> {
    return await this.db
      .select()
      .from(millionaireQuestions)
      .where(
        and(
          eq(millionaireQuestions.difficultyLevel, difficultyLevel),
          eq(millionaireQuestions.isActive, true)
        )
      );
  }

  async getRandomQuestionForLevel(level: number): Promise<any | null> {
    const questions = await this.findQuestionsByDifficulty(level);
    if (questions.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
  }

  // ==================== EVENT STATE OPERATIONS ====================

  async saveEventState(data: any): Promise<number> {
    const result = await this.db.insert(rotomEventStates).values({
      eventId: data.eventId,
      stateType: data.stateType,
      stateData: JSON.stringify(data.stateData),
      actorUuid: data.actorUuid,
    });

    return Number(result[0].insertId);
  }

  async getLatestEventState(eventId: number): Promise<any | null> {
    const result = await this.db
      .select()
      .from(rotomEventStates)
      .where(eq(rotomEventStates.eventId, eventId))
      .orderBy(drizzleSql`${rotomEventStates.createdAt} DESC`)
      .limit(1);

    return result[0] || null;
  }

  // ==================== ANSWER OPERATIONS ====================

  async saveAnswer(data: any): Promise<number> {
    const result = await this.db.insert(millionaireAnswers).values({
      eventId: data.eventId,
      questionId: data.questionId,
      playerUuid: data.playerUuid,
      answerIndex: data.answerIndex,
      isCorrect: data.isCorrect,
    });

    return Number(result[0].insertId);
  }

  // ==================== LIFELINE OPERATIONS ====================

  async useLifeline(eventId: number, lifelineType: string): Promise<boolean> {
    const millData = await this.findMillionaireData(eventId);
    if (!millData) return false;

    const lifelines = JSON.parse(millData.lifelinesRemaining);
    
    if (!lifelines[lifelineType]) {
      return false;
    }

    lifelines[lifelineType] = false;
    return await this.updateLifelines(eventId, lifelines);
  }

  async getLifelineResult(eventId: number, questionId: number, lifelineType: string): Promise<LifelineResult> {
    const question = await this.db
      .select()
      .from(millionaireQuestions)
      .where(eq(millionaireQuestions.id, questionId))
      .limit(1);

    if (!question[0]) {
      throw new Error('Question not found');
    }

    const answers = JSON.parse(question[0].answers);
    const correctAnswer = question[0].correctAnswer;

    switch (lifelineType) {
      case '50:50':
        return this.fiftyFifty(answers, correctAnswer);
      
      case 'phone':
        return this.phoneAFriend(correctAnswer);
      
      case 'audience':
        return this.askTheAudience(answers, correctAnswer);
      
      default:
        throw new Error('Invalid lifeline type');
    }
  }

  // ==================== HELPER METHODS ====================

  private generateEventCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private fiftyFifty(answers: string[], correctAnswer: number): LifelineResult {
    const incorrectIndices = answers
      .map((_, index) => index)
      .filter(index => index !== correctAnswer);

    const toRemove = incorrectIndices
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    return {
      type: '50:50',
      data: { removedAnswers: toRemove }
    };
  }

  private phoneAFriend(correctAnswer: number): LifelineResult {
    const confidence = Math.random() * 0.4 + 0.6; // 60-100% confidence
    const isCorrect = Math.random() < confidence;

    return {
      type: 'phone',
      data: {
        suggestedAnswer: isCorrect ? correctAnswer : Math.floor(Math.random() * 4),
        confidence: Math.round(confidence * 100)
      }
    };
  }

  private askTheAudience(answers: string[], correctAnswer: number): LifelineResult {
    const votes = new Array(answers.length).fill(0);
    
    // Give correct answer majority (50-80%)
    const correctPercentage = Math.random() * 0.3 + 0.5; // 50-80%
    votes[correctAnswer] = correctPercentage;

    // Distribute remaining votes
    const remaining = 1 - correctPercentage;
    const otherIndices = answers
      .map((_, index) => index)
      .filter(index => index !== correctAnswer);

    otherIndices.forEach((index, i) => {
      if (i === otherIndices.length - 1) {
        votes[index] = remaining - votes.slice(0, -1).reduce((a, b) => a + b, 0) + votes[correctAnswer];
      } else {
        votes[index] = Math.random() * (remaining / otherIndices.length);
      }
    });

    // Convert to percentages
    const percentages = votes.map(v => Math.round(v * 100));

    return {
      type: 'audience',
      data: { votes: percentages }
    };
  }
}
