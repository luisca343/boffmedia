import { ApiProperty } from '@nestjs/swagger';

export class MineReward {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the reward',
  })
  id: number;

  @ApiProperty({
    example: 'Gema Roja',
    description: 'Name of the reward',
  })
  name: string;

  @ApiProperty({
    example: 'gema',
    description: 'Type/category of the reward',
  })
  type: string;

  @ApiProperty({
    example: 'gema_roja',
    description: 'Item identifier',
  })
  itemId: string;

  @ApiProperty({
    example: 10000,
    description: 'Value/weight of the reward',
  })
  value: number;

  @ApiProperty({
    example: 1,
    description: 'Width in the mine layout',
  })
  width: number;

  @ApiProperty({
    example: 1,
    description: 'Height in the mine layout',
  })
  height: number;
}
