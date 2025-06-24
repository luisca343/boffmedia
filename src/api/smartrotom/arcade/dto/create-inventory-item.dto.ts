import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { ItemRarity } from '../entities/arcade-inventory.entity';

export class CreateInventoryItemDto extends BaseDto {
  @ApiProperty({ 
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4'
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ 
    description: 'Item ID',
    example: 'potion_heal'
  })
  @IsString()
  @MaxLength(32)
  itemId: string;

  @ApiProperty({ 
    description: 'Item type',
    example: 'consumable'
  })
  @IsString()
  @MaxLength(32)
  itemType: string;

  @ApiProperty({ 
    description: 'Item amount',
    example: 5,
    default: 1
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number = 1;

  @ApiProperty({ 
    description: 'Item rarity',
    example: 'common',
    default: 'common'
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  rarity?: ItemRarity = 'common';

  @ApiProperty({ 
    description: 'Source type (how item was obtained)',
    example: 'lootbox',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  sourceType?: string;

  @ApiProperty({ 
    description: 'Whether item has been used',
    example: 0,
    default: 0
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  used?: number = 0;
}