import { ApiProperty } from '@nestjs/swagger';
import { ArcadeInventory } from './arcade-inventory.entity';

export class InventoryItemGroup {
  [key: string]: ArcadeInventory[];
}

// Use this class for Swagger documentation
export class InventoryItemGroupDto {
  @ApiProperty({
    description: 'Items of a specific type',
    type: [ArcadeInventory],
    additionalProperties: { type: 'array', items: { $ref: 'ArcadeInventory' } }
  })
  items: Record<string, ArcadeInventory[]>;
}

export class ArcadeInventoryResponse {
  @ApiProperty({
    description: 'Aggregated inventory items list',
    type: [ArcadeInventory]
  })
  items: ArcadeInventory[];

  @ApiProperty({
    description: 'Items grouped by their type',
    type: InventoryItemGroup
  })
  groupedItems: Record<string, ArcadeInventory[]>;

  @ApiProperty({
    description: 'Raw inventory items from database without aggregation',
    type: [ArcadeInventory]
  })
  rawItems: ArcadeInventory[];
}