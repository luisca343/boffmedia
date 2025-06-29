import { ApiProperty } from '@nestjs/swagger';
import { MineReward } from './mine-reward.entity';

export class RewardTypeGroup {
  @ApiProperty({ 
    description: 'Array of rewards in this type',
    type: [MineReward]
  })
  items: MineReward[];

  @ApiProperty({ 
    description: 'Total value of all rewards in this type',
    example: 1500
  })
  totalValue: number;
}

export class RewardsByType {
  @ApiProperty({ 
    description: 'Rewards grouped by type',
    example: {
      gema: { items: [], totalValue: 1500 },
      piedra: { items: [], totalValue: 800 }
    },
    additionalProperties: {
      type: 'object',
      properties: {
        items: { type: 'array' },
        totalValue: { type: 'number' }
      }
    }
  })
  drops: { [key: string]: RewardTypeGroup };

  @ApiProperty({ 
    description: 'Total value of all rewards',
    example: 2300
  })
  totalValue: number;
}