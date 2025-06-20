import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';

export interface IArcadeInventoryRepository extends BaseRepository<any, any, any> {
  findUserInventory(uuid: string): Promise<any[]>;
  findUserItem(uuid: string, itemId: string): Promise<any | null>;
  addItem(inventoryData: any): Promise<{ insertId: number }>;
  updateItemQuantity(uuid: string, itemId: string, quantity: number): Promise<any>;
  removeItem(uuid: string, itemId: string): Promise<boolean>;
  consumeItem(uuid: string, itemId: string, quantity: number): Promise<any>;
  getTotalItems(uuid: string): Promise<number>;
  getItemsByType(uuid: string, type: string): Promise<any[]>;
  getItemsByRarity(uuid: string, rarity: string): Promise<any[]>;
}