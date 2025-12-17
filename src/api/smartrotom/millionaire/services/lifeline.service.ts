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
    eventId: number,
    questionId: number,
    lifelineType: string
  ): Promise<LifelineResult> {
    // Check if lifeline is available
    const used = await this.millionaireRepository.useLifeline(eventId, lifelineType);
    if (!used) {
      throw new BadRequestException('Lifeline not available');
    }

    // Get lifeline result
    return await this.millionaireRepository.getLifelineResult(eventId, questionId, lifelineType);
  }

  async isLifelineAvailable(eventId: number, lifelineType: string): Promise<boolean> {
    const millData = await this.millionaireRepository.findMillionaireData(eventId);
    if (!millData) return false;

    const lifelines = JSON.parse(millData.lifelinesRemaining);
    return lifelines[lifelineType] === true;
  }
}
