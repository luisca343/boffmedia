import { ApiProperty } from '@nestjs/swagger';

export class FetchStatusEntity {
  @ApiProperty({ 
    example: 'success', 
    description: 'Current fetch status',
    enum: ['fetching', 'success', 'error']
  })
  status: 'fetching' | 'success' | 'error';

  @ApiProperty({ 
    example: 'Data loaded successfully', 
    description: 'Status message' 
  })
  message: string;

  @ApiProperty({ 
    example: '2024-12-15T10:30:00Z', 
    description: 'Timestamp of the status update' 
  })
  timestamp: string;
}

export class CommonRewardEntity {
  @ApiProperty({ 
    example: 'pack-point', 
    description: 'Reward item ID' 
  })
  id: string;

  @ApiProperty({ 
    example: '5', 
    description: 'Reward quantity' 
  })
  quantity: string;
}

export class BattleTaskEntity {
  @ApiProperty({ 
    example: 'Win the battle', 
    description: 'Mission description' 
  })
  mission: string;

  @ApiProperty({ 
    description: 'Mission reward',
    type: 'object',
    properties: {
      quantity: { type: 'number', example: 1 },
      id: { type: 'string', example: 'booster-pack' }
    }
  })
  reward: {
    quantity: number;
    id: string;
  };
}

export class DeckCardEntity {
  @ApiProperty({ 
    example: 'charizard', 
    description: 'Pack identifier' 
  })
  pack: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Card number' 
  })
  cardNumber: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Number of copies in deck' 
  })
  quantity: number;
}

export class QuestEntity {
  @ApiProperty({ 
    example: 'Beginner Challenge', 
    description: 'Quest name' 
  })
  name: string;

  @ApiProperty({ 
    description: 'Cards used in the quest deck',
    type: [DeckCardEntity]
  })
  deckListing: DeckCardEntity[];

  @ApiProperty({ 
    description: 'Battle tasks and rewards',
    type: [BattleTaskEntity]
  })
  battleTasks: BattleTaskEntity[];
}

export class BattleDataEntity {
  @ApiProperty({ 
    description: 'Common rewards available in all battles',
    type: [CommonRewardEntity]
  })
  commonRewards: CommonRewardEntity[];

  @ApiProperty({ 
    description: 'Individual quest information',
    type: [QuestEntity]
  })
  quests: QuestEntity[];
}

export class SetDataEntity {
  @ApiProperty({ 
    example: 'Genetic Apex', 
    description: 'Set name' 
  })
  setName: string;

  @ApiProperty({ 
    example: 'https://example.com/logo.png', 
    description: 'Set logo URL',
    required: false 
  })
  logo?: string;

  @ApiProperty({ 
    example: 'https://example.com/icon.png', 
    description: 'Set icon URL',
    required: false 
  })
  icon?: string;

  @ApiProperty({ 
    example: '2024-10-30', 
    description: 'Release date',
    required: false 
  })
  releaseDate?: string;

  @ApiProperty({ 
    description: 'List of booster packs in this set',
    type: [Object],
    required: false 
  })
  boosterPackList?: any[];

  @ApiProperty({ 
    description: 'List of cards in this set',
    type: [Object],
    required: false 
  })
  cardList?: any[];
}

export class SetsDataEntity {
  @ApiProperty({ 
    description: 'Main expansion sets',
    type: [SetDataEntity]
  })
  mainSets: SetDataEntity[];

  @ApiProperty({ 
    description: 'Promotional sets',
    type: [SetDataEntity]
  })
  promoSets: SetDataEntity[];
}