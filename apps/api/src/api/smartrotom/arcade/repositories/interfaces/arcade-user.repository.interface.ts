import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IArcadeUserRepository extends BaseRepository<any, any, any> {
  findByUuid(uuid: string): Promise<any | null>;
  createUser(userData: any): Promise<{ insertId: number }>;
  updateCoins(uuid: string, coins: number): Promise<any>;
  updateLevel(uuid: string, level: number, experience: number): Promise<any>;
  addCoins(uuid: string, amount: number): Promise<any>;
  spendCoins(uuid: string, amount: number): Promise<any>;
  addExperience(uuid: string, experience: number): Promise<any>;
  updateLastActivity(uuid: string): Promise<any>;
  getUserStats(uuid: string): Promise<any | null>;
}
