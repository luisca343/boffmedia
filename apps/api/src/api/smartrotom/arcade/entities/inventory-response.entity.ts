import { ApiProperty } from '@nestjs/swagger';
import { ArcadeInventoryItem } from './arcade-inventory.entity';

export class InventoryItemGroup {
  [key: string]: ArcadeInventoryItem[];
}

// Use this class for Swagger documentation
export class InventoryItemGroupDto {
  @ApiProperty({
    description: 'Items of a specific type',
    type: [ArcadeInventoryItem],
    additionalProperties: { type: 'array', items: { $ref: 'ArcadeInventory' } },
  })
  items: Record<string, ArcadeInventoryItem[]>;
}

export class ArcadeInventoryResponse {
  @ApiProperty({
    description: 'Aggregated inventory items list',
    type: [ArcadeInventoryItem],
  })
  items: ArcadeInventoryItem[];

  @ApiProperty({
    description: 'Items grouped by their type',
    type: InventoryItemGroup,
  })
  groupedItems: Record<string, ArcadeInventoryItem[]>;

  @ApiProperty({
    description: 'Raw inventory items from database without aggregation',
    type: [ArcadeInventoryItem],
  })
  rawItems: ArcadeInventoryItem[];
}
