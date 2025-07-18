import { ApiProperty } from '@nestjs/swagger';

export class CardEntity {
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
    example: 'Pikachu ex', 
    description: 'Card name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'pokemon', 
    description: 'Card type',
    enum: ['pokemon', 'trainer', 'energy']
  })
  type: string;

  @ApiProperty({ 
    example: 'star2', 
    description: 'Card rarity',
    enum: ['diamond1', 'diamond2', 'diamond3', 'diamond4', 'star1', 'star2', 'star3', 'crown', 'promo']
  })
  rarity: string | null;

  @ApiProperty({ 
    example: 190, 
    description: 'HP value for Pokemon cards',
    required: false 
  })
  hp?: number | null;

  @ApiProperty({ 
    example: 'fighting', 
    description: 'Weakness type',
    required: false 
  })
  weakness?: string | null;

  @ApiProperty({ 
    example: 2, 
    description: 'Weakness damage multiplier',
    required: false 
  })
  weaknessValue?: number | null;

  @ApiProperty({ 
    example: 1, 
    description: 'Retreat cost',
    required: false 
  })
  retreatCost?: number | null;

  @ApiProperty({ 
    example: 'https://example.com/card-image.png', 
    description: 'Card image URL',
    required: false 
  })
  imageUrl?: string | null;

  @ApiProperty({ 
    example: 'A powerful electric Pokemon with incredible speed.', 
    description: 'Card description',
    required: false 
  })
  description?: string | null;
}