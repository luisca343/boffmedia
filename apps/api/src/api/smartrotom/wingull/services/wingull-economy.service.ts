import { HttpException, Inject, Injectable } from '@nestjs/common';
import { WingullBalanceDto } from '../dto/wingull-balance.dto';
import { WINGULL_ECONOMY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullEconomyRepository } from '../repositories/interfaces/wingull-economy.repository.interface';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullEconomyService {
  constructor(
    private readonly logger: Logger,

    @Inject(WINGULL_ECONOMY_REPOSITORY_TOKEN)
    private readonly wingullEconomyRepository: IWingullEconomyRepository,
  ) {}

  async updateBalance(balanceData: WingullBalanceDto): Promise<any> {
    try {
      return await this.wingullEconomyRepository.updateBalanceInAPI(
        balanceData,
      );
    } catch (error: any) {
      this.logger.error('Failed to update balance:', error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }

  async getCurrentBalance(uuid: string, amount?: number): Promise<number> {
    try {
      const result =
        await this.wingullEconomyRepository.getCurrentBalanceFromAPI(
          uuid,
          amount,
        );
      return result || 0;
    } catch (error: any) {
      this.logger.error(`Failed to get current balance for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Current balance retrieval failed: ${error.message}`);
    }
  }

  async getMoney(uuid: string): Promise<number> {
    try {
      const result = await this.wingullEconomyRepository.getMoneyFromAPI(uuid);
      return result.money || 0;
    } catch (error: any) {
      this.logger.error(`Failed to get money for ${uuid}:`, error);
      // A typed HTTP error (404/403/409…) has to reach the client as itself;
      // wrapping it in a bare Error turned all of them into 500s.
      if (error instanceof HttpException) throw error;
      throw new Error(`Money retrieval failed: ${error.message}`);
    }
  }
}
