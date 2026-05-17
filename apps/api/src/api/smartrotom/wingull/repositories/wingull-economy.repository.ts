import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import { WingullBalanceDto } from '../dto/wingull-balance.dto';
import { IWingullEconomyRepository } from './interfaces/wingull-economy.repository.interface';
import { Logger } from 'nestjs-pino';

@Injectable()
export class WingullEconomyRepository implements IWingullEconomyRepository {
  constructor(private readonly logger: Logger) {}

  private readonly WINGULL_API_BASE_URL = process.env.WINGULL_API;
  private readonly DEFAULT_TIMEOUT = 10000;

  async updateBalanceInAPI(balanceData: WingullBalanceDto): Promise<any> {
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/updateBalance`,
        balanceData,
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error('Failed to update balance in WINGULL API:', error);
      throw new Error(`Balance update failed: ${error.message}`);
    }
  }

  async getCurrentBalanceFromAPI(uuid: string, amount?: number): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting current balance');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/getCurrentBalance`,
        { uuid, amount },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get current balance for UUID ${uuid}:`,
        error,
      );
      throw new Error(`Current balance retrieval failed: ${error.message}`);
    }
  }

  async getMoneyFromAPI(uuid: string): Promise<any> {
    if (!uuid || uuid.trim() === '') {
      throw new Error('UUID is required for getting money');
    }
    if (!this.WINGULL_API_BASE_URL) {
      throw new Error('WINGULL_API environment variable is not configured');
    }
    try {
      const response: AxiosResponse = await axios.post(
        `${this.WINGULL_API_BASE_URL}/money`,
        { uuid },
        {
          timeout: this.DEFAULT_TIMEOUT,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(`Failed to get money for UUID ${uuid}:`, error);
      throw new Error(`Money retrieval failed: ${error.message}`);
    }
  }
}
