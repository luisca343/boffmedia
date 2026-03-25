import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IArcadeLootboxRepository extends BaseRepository<any, any, any> {
  findUserLootboxes(uuid: string): Promise<any[]>;
  findUserLootboxByType(uuid: string, type: string): Promise<any | null>;
  addLootbox(lootboxData: any): Promise<{ insertId: number }>;
  consumeLootbox(uuid: string, type: string): Promise<any>;
  updateAvailable(uuid: string, type: string, available: number): Promise<any>;
  resetDailyLootboxes(uuid: string): Promise<any>;
  getLootboxCount(uuid: string, type: string): Promise<number>;
  updateLastOpened(uuid: string, type: string): Promise<any>;
}