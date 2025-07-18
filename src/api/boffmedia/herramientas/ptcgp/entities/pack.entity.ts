import { ApiProperty } from '@nestjs/swagger';

export class BoosterPackEntity {
  @ApiProperty({ 
    example: 'Charizard Pack', 
    description: 'Booster pack name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion this pack belongs to' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 'https://example.com/pack-image.png', 
    description: 'Pack image URL',
    required: false 
  })
  imageUrl?: string | null;

  @ApiProperty({ 
    example: 'Features powerful Fire-type Pokemon including Charizard ex.', 
    description: 'Pack description',
    required: false 
  })
  description?: string | null;
}

export class PackProbabilitiesEntity {
  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion identifier' 
  })
  expansion: string;

  @ApiProperty({ 
    example: 'charizard', 
    description: 'Pack identifier' 
  })
  packId: string;

  @ApiProperty({ 
    description: 'Probability for each rarity across 5 card positions',
    example: {
      diamond1: [1.0, 1.0, 1.0, 0.0, 0.0],
      diamond2: [0.0, 0.0, 0.0, 0.9, 0.6],
      star2: [0.0, 0.0, 0.0, 0.005, 0.02]
    }
  })
  probabilities: {
    [rarity: string]: number[];
  };
}

export class BestPackEntity {
  @ApiProperty({ 
    example: 'charizard', 
    description: 'Recommended pack to pull' 
  })
  bestPack: string;

  @ApiProperty({ 
    example: 145.5, 
    description: 'Score for the best pack' 
  })
  score: number;

  @ApiProperty({ 
    description: 'Scores for all available packs',
    example: {
      charizard: 145.5,
      pikachu: 120.3,
      mewtwo: 98.7
    }
  })
  allScores: {
    [packName: string]: number;
  };

  @ApiProperty({ 
    example: 'genetic-apex', 
    description: 'Expansion being analyzed',
    required: false 
  })
  expansion?: string;
}