import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { LootboxItemConfig } from '../entities/lootbox-config.entity';

export class OpenLootBoxDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Box type ID', example: 'trainer_box' })
  @IsNotEmpty()
  @IsString()
  boxId: string;
}

class SpinnerItemDto {
  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  id: string;

  @ApiProperty({ description: 'Item weight for probability', example: 2 })
  weight: number;

  @ApiProperty({
    description: 'Whether this is the winning item',
    example: true,
  })
  isWinningItem: boolean;
}

class _LootItemDto {
  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  id: string;

  @ApiProperty({ description: 'Item rarity', example: 'legendary' })
  rarity: string;

  @ApiProperty({
    description: 'Server inventory item ID',
    required: false,
    example: 456,
  })
  serverId?: number;

  @ApiProperty({ description: 'Item type', example: 'item' })
  type?: string;

  @ApiProperty({
    description: 'Additional data associated with the item',
    example: 'Pikachu lvl:25',
  })
  data?: string;
}

export class OpenLootBoxResponseDto {
  @ApiProperty({
    description: 'The item obtained from the loot box',
    required: false,
    type: LootboxItemConfig,
  })
  item?: LootboxItemConfig;

  @ApiProperty({
    description: 'Array of items to display in the spinner animation',
    type: [SpinnerItemDto],
    required: false,
  })
  spinnerItems?: SpinnerItemDto[];

  @ApiProperty({
    description: 'Position of the winning item in the spinner array',
    example: 285,
    required: false,
  })
  winningPosition?: number;
}
