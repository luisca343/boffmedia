import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository } from '../repositories/interfaces/millionaire.repository.interface';

export interface QuestionForPlayer {
  id: number;
  text: string;
  answers: string[];
  difficultyLevel: number;
}

@Injectable()
export class QuestionService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async getQuestionForLevel(level: number): Promise<any> {
    if (level < 1 || level > 15) {
      throw new NotFoundException('Invalid question level');
    }

    const question = await this.millionaireRepository.getRandomQuestionForLevel(level);
    if (!question) {
      throw new NotFoundException(`No questions available for level ${level}`);
    }

    return question;
  }

  async getQuestionForPlayer(questionId: number): Promise<QuestionForPlayer> {
    // This returns question without revealing correct answer
    const questions = await this.millionaireRepository.findQuestionsByDifficulty(1);
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return {
      id: question.id,
      text: question.text,
      answers: JSON.parse(question.answers),
      difficultyLevel: question.difficultyLevel
    };
  }

  async validateAnswer(questionId: number, answerIndex: number): Promise<boolean> {
    const questions = await this.millionaireRepository.findQuestionsByDifficulty(1);
    const question = questions.find(q => q.id === questionId);
    
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return question.correctAnswer === answerIndex;
  }
}
