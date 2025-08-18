import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional, IsEnum, IsArray, IsDate, IsNumber } from 'class-validator';

export type ItemRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";
export type ItemRarityEnum = ['common', 'uncommon', 'rare', 'epic', 'legendary']

export class ArcadeInventoryItem {
  @ApiProperty({ example: 1, description: 'Unique identifier for the inventory record' })
  @IsInt()
  id: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', description: 'Player UUID' })
  @IsString()
  uuid: string;

  @ApiProperty({ example: 'potion_heal', description: 'Item ID' })
  @IsString()
  itemId: string;

  @ApiProperty({ example: 'Pikachu lvl:25 shiny', description: 'Item data (used for Pokemon specs)' })
  @IsString()
  @IsOptional()
  itemData?: string;

  @ApiProperty({ example: 'consumable', description: 'Item type' })
  @IsString()
  itemType: string;

  @ApiProperty({ example: 5, description: 'Item amount' })
  @IsInt()
  amount: number;

  @ApiProperty({ example: 'rare', description: 'Item rarity', enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'] })
  @IsEnum(['common', 'uncommon', 'rare', 'epic', 'legendary'])
  rarity: ItemRarity;

  @ApiProperty({ example: 'lootbox', description: 'Source type (how item was obtained)' })
  @IsString()
  sourceType: string;

  @ApiProperty({ example: 0, description: 'Whether item has been used (0 = not used, 1 = used)' })
  @IsInt()
  used: number;

  @ApiProperty({ example: '2023-11-01T10:00:00Z', description: 'Record creation date' })
  @IsOptional()
  @IsDate()
  createdAt?: Date;

  @ApiProperty({ example: 3, description: 'Remaining amount (for consumables)', required: false })
  @IsOptional()
  @IsInt()
  remainingAmount?: number;

  @ApiProperty({ example: [1, 2, 3], description: 'Original database IDs for this aggregated item', required: false })
  @IsOptional()
  @IsArray()
  originalIds?: number[];
}