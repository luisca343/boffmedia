import { SuccessResponse } from '@api/_utils/entities/common-response.entity';
import { WingullBalanceDto } from '../../dto/wingull-balance.dto';

export interface IWingullEconomyRepository {
  updateBalanceInAPI(balanceData: WingullBalanceDto): Promise<SuccessResponse>;
  getCurrentBalanceFromAPI(uuid: string, amount?: number): Promise<number>;
  getMoneyFromAPI(uuid: string): Promise<any>;
}
