import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { 
  millionaireSessions,
  millionairePlayers,
  millionaireQuestions,
  millionaireGameStates,
  millionaireAnswers
} from '@/_db/schema/SmartRotomMillionaire';
import { IMillionaireRepository, SessionData, LifelineResult } from './interfaces/millionaire.repository.interface';

@Injectable()
export class MillionaireRepository implements IMillionaireRepository {
  constructor(
    @Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>,
  ) {}

  // ==================== SESSION OPERATIONS ====================

  async createSession(data: SessionData): Promise<{ sessionId: number; sessionCode: string }> {
    const sessionCode = this.generateSessionCode();
    
    const result = await this.db.insert(millionaireSessions).values({
      sessionCode,
      conductorUuid: data.conductorUuid,
    });

    return {
      sessionId: Number(result[0].insertId),
      sessionCode
    };
  }

  async findSessionByCode(sessionCode: string): Promise<any | null> {
    const results = await this.db
      .select()
      .from(millionaireSessions)
      .where(eq(millionaireSessions.sessionCode, sessionCode))
      .limit(1);

    return results[0] || null;
  }

  async findSessionById(sessionId: number): Promise<any | null> {
    const results = await this.db
      .select()
      .from(millionaireSessions)
      .where(eq(millionaireSessions.id, sessionId))
      .limit(1);

    return results[0] || null;
  }

  async updateSessionStatus(sessionId: number, status: string): Promise<boolean> {
    const result = await this.db
      .update(millionaireSessions)
      .set({ status: status as any })
      .where(eq(millionaireSessions.id, sessionId));

    return result[0].affectedRows > 0;
  }

  async advanceQuestion(sessionId: number): Promise<boolean> {
    const session = await this.findSessionById(sessionId);
    if (!session) return false;

    const result = await this.db
      .update(millionaireSessions)
      .set({ currentQuestion: session.currentQuestion + 1 })
      .where(eq(millionaireSessions.id, sessionId));

    return result[0].affectedRows > 0;
  }

  async updatePrizeMoney(sessionId: number, amount: string): Promise<boolean> {
    const result = await this.db
      .update(millionaireSessions)
      .set({ prizeMoney: amount })
      .where(eq(millionaireSessions.id, sessionId));

    return result[0].affectedRows > 0;
  }

  // ==================== PLAYER OPERATIONS ====================

  async addPlayer(sessionId: number, uuid: string, name: string): Promise<number> {
    const result = await this.db.insert(millionairePlayers).values({
      sessionId,
      uuid,
      name,
      connectionStatus: 'CONNECTED'
    });

    return Number(result[0].insertId);
  }

  async updatePlayerConnection(playerId: number, status: string): Promise<boolean> {
    const result = await this.db
      .update(millionairePlayers)
      .set({ 
        connectionStatus: status as any,
        lastHeartbeat: new Date()
      })
      .where(eq(millionairePlayers.id, playerId));

    return result[0].affectedRows > 0;
  }

  async findPlayerByUuid(sessionId: number, uuid: string): Promise<any | null> {
    const results = await this.db
      .select()
      .from(millionairePlayers)
      .where(
        and(
          eq(millionairePlayers.sessionId, sessionId),
          eq(millionairePlayers.uuid, uuid)
        )
      )
      .limit(1);

    return results[0] || null;
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

  // ==================== GAME STATE OPERATIONS ====================

  async saveGameState(data: any): Promise<number> {
    const result = await this.db.insert(millionaireGameStates).values(data);
    return Number(result[0].insertId);
  }

  async getLatestGameState(sessionId: number): Promise<any | null> {
    const results = await this.db
      .select()
      .from(millionaireGameStates)
      .where(eq(millionaireGameStates.sessionId, sessionId))
      .orderBy(desc(millionaireGameStates.createdAt))
      .limit(1);

    return results[0] || null;
  }

  // ==================== ANSWER OPERATIONS ====================

  async saveAnswer(data: any): Promise<number> {
    const result = await this.db.insert(millionaireAnswers).values(data);
    return Number(result[0].insertId);
  }

  // ==================== LIFELINE OPERATIONS ====================

  async useLifeline(sessionId: number, lifelineType: string): Promise<boolean> {
    const session = await this.findSessionById(sessionId);
    if (!session) return false;

    const lifelines = JSON.parse(session.lifelinesRemaining);
    if (!lifelines[lifelineType]) return false;

    lifelines[lifelineType] = false;

    const result = await this.db
      .update(millionaireSessions)
      .set({ lifelinesRemaining: JSON.stringify(lifelines) })
      .where(eq(millionaireSessions.id, sessionId));

    return result[0].affectedRows > 0;
  }

  async getLifelineResult(sessionId: number, questionId: number, lifelineType: string): Promise<LifelineResult> {
    const question = await this.db
      .select()
      .from(millionaireQuestions)
      .where(eq(millionaireQuestions.id, questionId))
      .limit(1);

    if (!question[0]) {
      throw new Error('Question not found');
    }

    const correctAnswer = question[0].correctAnswer;
    const answers = JSON.parse(question[0].answers);

    switch (lifelineType) {
      case '50:50':
        return this.generateFiftyFifty(correctAnswer, answers.length);
      
      case 'phone':
        return this.generatePhoneAFriend(correctAnswer);
      
      case 'audience':
        return this.generateAskTheAudience(correctAnswer, answers.length);
      
      default:
        throw new Error('Invalid lifeline type');
    }
  }

  // ==================== HELPER METHODS ====================

  private generateSessionCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateFiftyFifty(correctAnswer: number, totalAnswers: number): LifelineResult {
    const incorrectAnswers = Array.from({ length: totalAnswers }, (_, i) => i)
      .filter(i => i !== correctAnswer);
    
    // Remove 2 incorrect answers randomly
    const toRemove = incorrectAnswers
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);

    return {
      type: '50:50',
      data: {
        removedAnswers: toRemove
      }
    };
  }

  private generatePhoneAFriend(correctAnswer: number): LifelineResult {
    // Simulate friend confidence (70-95% for correct, lower for incorrect)
    const isCorrect = Math.random() > 0.15; // 85% chance friend knows
    const suggestedAnswer = isCorrect ? correctAnswer : Math.floor(Math.random() * 4);
    const confidence = isCorrect 
      ? Math.floor(Math.random() * 25) + 70  // 70-95%
      : Math.floor(Math.random() * 40) + 30; // 30-70%

    return {
      type: 'phone',
      data: {
        suggestedAnswer,
        confidence,
        message: `I'm ${confidence}% sure the answer is option ${suggestedAnswer + 1}.`
      }
    };
  }

  private generateAskTheAudience(correctAnswer: number, totalAnswers: number): LifelineResult {
    // Generate audience percentages with correct answer having highest percentage
    const percentages = new Array(totalAnswers).fill(0);
    let remaining = 100;

    // Give correct answer 40-70% of votes
    percentages[correctAnswer] = Math.floor(Math.random() * 30) + 40;
    remaining -= percentages[correctAnswer];

    // Distribute remaining votes among other answers
    for (let i = 0; i < totalAnswers; i++) {
      if (i !== correctAnswer && remaining > 0) {
        const portion = Math.floor(Math.random() * (remaining / 2)) + 5;
        percentages[i] = Math.min(portion, remaining);
        remaining -= percentages[i];
      }
    }

    // Give any remaining votes to random answer
    if (remaining > 0) {
      const randomIndex = Math.floor(Math.random() * totalAnswers);
      percentages[randomIndex] += remaining;
    }

    return {
      type: 'audience',
      data: {
        percentages
      }
    };
  }
}
