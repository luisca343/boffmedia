import { Injectable } from '@nestjs/common';
import { WingullRepository, WingullBalance } from '@repositories/smartrotom/wingull.repository';

@Injectable()
export class WingullEconomyService {
  constructor(
    private readonly wingullRepository: WingullRepository,
  ) {}

  async updateBalance(balanceData: WingullBalance): Promise<any> {
    try {
      return await this.wingullRepository.updateBalanceInAPI(balanceData);
    } catch (error) {
      console.error('Failed to update balance:', error);
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }

  async getCurrentBalance(uuid: string, amount?: number): Promise<number> {
    try {
      const result = await this.wingullRepository.getCurrentBalanceFromAPI(uuid, amount);
      return result.balance || 0;
    } catch (error) {
      console.error(`Failed to get current balance for ${uuid}:`, error);
      throw new Error(`Current balance retrieval failed: ${error.message}`);
    }
  }

  async getMoney(uuid: string): Promise<number> {
    try {
      const result = await this.wingullRepository.getMoneyFromAPI(uuid);
      return result.money || 0;
    } catch (error) {
      console.error(`Failed to get money for ${uuid}:`, error);
      throw new Error(`Money retrieval failed: ${error.message}`);
    }
  }
}