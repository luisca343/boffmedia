import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class OpenLootBoxDto {
  @ApiProperty({ description: 'Player UUID', example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({ description: 'Box type ID', example: 'trainer_box' })
  @IsNotEmpty()
  @IsString()
  boxId: string;

  @ApiProperty({ description: 'Inventory item ID to consume', example: 123 })
  @IsNotEmpty()
  @IsNumber()
  itemId: number;
}

class SpinnerItemDto {
  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  id: string;

  @ApiProperty({ description: 'Item weight for probability', example: 2 })
  weight: number;

  @ApiProperty({ description: 'Whether this is the winning item', example: true })
  isWinningItem: boolean;
}

class LootItemDto {
  @ApiProperty({ description: 'Item ID', example: 'pixelmon:master_ball' })
  id: string;

  @ApiProperty({ description: 'Item rarity', example: 'legendary' })
  rarity: string;

  @ApiProperty({ description: 'Server inventory item ID', required: false, example: 456 })
  serverId?: number;
}

export class OpenLootBoxResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful', example: true })
  success: boolean;

  @ApiProperty({ description: 'Message describing the result', required: false, example: 'Successfully opened loot box' })
  message?: string;

  @ApiProperty({ description: 'The item obtained from the loot box', required: false, type: LootItemDto })
  item?: LootItemDto;

  @ApiProperty({ 
    description: 'Array of items to display in the spinner animation', 
    type: [SpinnerItemDto],
    required: false
  })
  spinnerItems?: SpinnerItemDto[];

  @ApiProperty({ 
    description: 'Position of the winning item in the spinner array',
    example: 285,
    required: false
  })
  winningPosition?: number;
}