import { Inject, Injectable } from '@nestjs/common';
import { WingullBalanceDto } from '../dto/wingull-balance.dto';
import { WINGULL_ECONOMY_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { IWingullEconomyRepository } from '../repositories/interfaces/wingull-economy.repository.interface';

@Injectable()
export class WingullEconomyService {
  constructor(
    @Inject(WINGULL_ECONOMY_REPOSITORY_TOKEN)
    private readonly wingullEconomyRepository: IWingullEconomyRepository,
  ) {}

  async updateBalance(balanceData: WingullBalanceDto): Promise<any> {
    try {
      return await this.wingullEconomyRepository.updateBalanceInAPI(
        balanceData,
      );
    } catch (error: any) {
      console.error('Failed to update balance:', error);
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
      console.error(`Failed to get current balance for ${uuid}:`, error);
      throw new Error(`Current balance retrieval failed: ${error.message}`);
    }
  }

  async getMoney(uuid: string): Promise<number> {
    try {
      const result = await this.wingullEconomyRepository.getMoneyFromAPI(uuid);
      return result.money || 0;
    } catch (error: any) {
      console.error(`Failed to get money for ${uuid}:`, error);
      throw new Error(`Money retrieval failed: ${error.message}`);
    }
  }
}
