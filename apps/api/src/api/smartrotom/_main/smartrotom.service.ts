import { Injectable } from '@nestjs/common';
import { StarbankFacadeService } from '../starbank/starbank.facade.service';
import { DailyRewardsConfig } from '../arcade/entities/daily-rewards.entity';
import { Logger } from 'nestjs-pino';
import { ArceuspeakRepository } from './repositories/arceuspeak.repository';

@Injectable()
export class SmartrotomService {
  private rewardsConfig: DailyRewardsConfig;

  constructor(
    private readonly logger: Logger,

    private readonly arceuspeakRepository: ArceuspeakRepository,
    private starbankService: StarbankFacadeService,
  ) {}

  async getArceuspeak() {
    return this.arceuspeakRepository.findAll();
  }

  async createOrUpdateArceuspeak(name: string, value: string, format: string) {
    return this.arceuspeakRepository.insert(name, value, format);
  }
}
