import { ApiProperty } from '@nestjs/swagger';
import { TcgCardEntity } from './tcg-card.entity';

export class SeriesCardsGroupEntity {
  @ApiProperty({ 
    description: 'Set ID',
    example: 'A1'
  })
  setId: string;

  @ApiProperty({ 
    description: 'Set name (localized)',
    example: 'Genetic Apex'
  })
  setName: string;

  @ApiProperty({ 
    description: 'Number of cards in this set',
    example: 286
  })
  cardCount: number;

  @ApiProperty({ 
    description: 'Cards in this set',
    type: [TcgCardEntity]
  })
  cards: TcgCardEntity[];
}

export class SeriesCardsGroupedEntity {
  @ApiProperty({ 
    description: 'Success status',
    example: true
  })
  success: boolean;

  @ApiProperty({ 
    description: 'Series cards grouped by set',
    type: [SeriesCardsGroupEntity]
  })
  data: SeriesCardsGroupEntity[];

  @ApiProperty({ 
    description: 'Total number of sets',
    example: 3
  })
  setCount: number;

  @ApiProperty({ 
    description: 'Total number of cards across all sets',
    example: 858
  })
  totalCardCount: number;
}