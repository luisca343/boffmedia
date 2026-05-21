import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArcadeInventoryItem } from '../entities/arcade-inventory.entity';

export class ClaimItemsDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Array of inventory items to claim',
    example: [
      {
        id: 1,
        itemId: 'pixelmon:master_ball',
        itemType: 'item',
        amount: 5,
        used: 2,
        rarity: 'rare',
      },
      {
        id: 2,
        itemId: 'pikachu_pokemon',
        itemType: 'pokemon',
        amount: 1,
        used: 0,
        rarity: 'legendary',
      },
    ],
    type: [ArcadeInventoryItem],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ArcadeInventoryItem)
  items: ArcadeInventoryItem[];
}

export class ClaimItemsResponseDto {
  @ApiProperty({
    description: 'Item IDs that were successfully claimed and consumed',
    example: ['pixelmon:master_ball', 'pokeball_item'],
  })
  claimedItems: string[];

  @ApiProperty({
    description: 'Item IDs that could not be found or consumed',
    example: ['non_existent_item'],
  })
  failedItems: string[];

  @ApiProperty({
    description: 'Pokemon items that were given to the player',
    example: ['pikachu_pokemon'],
  })
  pokemonItems: string[];

  @ApiProperty({
    description: 'Regular items that were given to the player',
    example: ['pixelmon:master_ball', 'pokeball_item'],
  })
  regularItems: string[];

  @ApiProperty({
    description: 'Overall success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Successfully claimed 2 items from 3 requested',
  })
  message: string;
}
