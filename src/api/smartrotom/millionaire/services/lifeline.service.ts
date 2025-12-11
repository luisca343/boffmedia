import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { MILLIONAIRE_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IMillionaireRepository, LifelineResult } from '../repositories/interfaces/millionaire.repository.interface';

@Injectable()
export class LifelineService {
  constructor(
    @Inject(MILLIONAIRE_REPOSITORY_TOKEN)
    private readonly millionaireRepository: IMillionaireRepository,
  ) {}

  async useLifeline(
    sessionId: number,
    questionId: number,
    lifelineType: string
  ): Promise<LifelineResult> {
    // Check if lifeline is available
    const used = await this.millionaireRepository.useLifeline(sessionId, lifelineType);
    if (!used) {
      throw new BadRequestException('Lifeline not available');
    }

    // Get lifeline result
    return await this.millionaireRepository.getLifelineResult(sessionId, questionId, lifelineType);
  }

  async isLifelineAvailable(sessionId: number, lifelineType: string): Promise<boolean> {
    const session = await this.millionaireRepository.findSessionById(sessionId);
    if (!session) return false;

    const lifelines = JSON.parse(session.lifelinesRemaining);
    return lifelines[lifelineType] === true;
  }
}
