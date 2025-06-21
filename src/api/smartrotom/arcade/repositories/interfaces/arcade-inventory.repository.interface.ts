import { BaseRepository } from '@api/_utils/repositories/base-repository.interface';
import { ArcadeInventory } from '../../entities/arcade-inventory.entity';
import { CreateInventoryItemDto } from '../../dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from '../../dto/update-inventory-item.dto';

export interface IArcadeInventoryRepository extends BaseRepository<ArcadeInventory, CreateInventoryItemDto, UpdateInventoryItemDto>  {
  findUserInventory(uuid: string): Promise<ArcadeInventory[]>;
  findUserItem(uuid: string, itemId: string): Promise<any | null>;
  addItem(inventoryData: any): Promise<{ insertId: number }>;
  updateItemQuantity(uuid: string, itemId: string, quantity: number): Promise<any>;
  removeItem(uuid: string, itemId: string): Promise<boolean>;
  consumeItem(uuid: string, itemId: string, quantity: number): Promise<any>;
  getTotalItems(uuid: string): Promise<number>;
  getItemsByType(uuid: string, type: string): Promise<any[]>;
  getItemsByRarity(uuid: string, rarity: string): Promise<any[]>;
}