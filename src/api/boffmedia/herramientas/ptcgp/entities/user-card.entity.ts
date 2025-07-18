import { ApiProperty } from '@nestjs/swagger';

export class UserCardEntity {
  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Card number within the expansion' 
  })
  cardNumber: number;

  @ApiProperty({ 
    example: 3, 
    description: 'Number of copies owned' 
  })
  count: number;

  @ApiProperty({ 
    example: 'Pikachu ex', 
    description: 'Card name',
    nullable: true 
  })
  cardName: string | null;
}

export class CardUpdateResultEntity {
  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Card number within the expansion' 
  })
  cardNumber: number;

  @ApiProperty({ 
    example: 2, 
    description: 'Previous count before update' 
  })
  oldCount: number;

  @ApiProperty({ 
    example: 3, 
    description: 'New count after update' 
  })
  newCount: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Change applied to the count' 
  })
  change: number;
}

export class RecentCardUpdateEntity {
  @ApiProperty({ 
    example: 123, 
    description: 'Update record ID' 
  })
  id: number;

  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Card number within the expansion' 
  })
  cardNumber: number;

  @ApiProperty({ 
    example: 3, 
    description: 'Count after this update' 
  })
  count: number;

  @ApiProperty({ 
    example: '2024-12-15T10:30:00Z', 
    description: 'When the update occurred' 
  })
  updatedAt: Date;

  @ApiProperty({ 
    example: 'Pikachu ex', 
    description: 'Card name',
    nullable: true 
  })
  cardName: string | null;
}

export class MissingCardEntity {
  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Card number within the expansion' 
  })
  number: number;

  @ApiProperty({ 
    example: 'star2', 
    description: 'Card rarity',
    nullable: true 
  })
  rarity: string | null;

  @ApiProperty({ 
    example: 'Pikachu ex', 
    description: 'Card name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'charizard', 
    description: 'Pack where this card can be found',
    nullable: true 
  })
  pack: string | null;
}

export class CollectionStatsEntity {
  @ApiProperty({ 
    example: 286, 
    description: 'Total number of unique cards in the collection' 
  })
  totalCards: number;

  @ApiProperty({ 
    example: 142, 
    description: 'Number of unique cards owned' 
  })
  ownedCards: number;

  @ApiProperty({ 
    example: 144, 
    description: 'Number of unique cards missing' 
  })
  missingCards: number;

  @ApiProperty({ 
    example: 49.65, 
    description: 'Collection completion percentage' 
  })
  completionPercentage: number;
}