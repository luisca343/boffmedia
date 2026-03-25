import { ApiProperty } from '@nestjs/swagger';

export class CharmEntity {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the charm' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Attack Charm', 
    description: 'Name of the charm' 
  })
  name: string;

  @ApiProperty({ 
    example: 'Increases attack power', 
    description: 'Description of the charm effect' 
  })
  description: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Rarity level of the charm' 
  })
  rarity: number;

  @ApiProperty({ 
    description: 'Skills provided by the charm',
    example: [],
    type: [Object]
  })
  skills: any[];

  @ApiProperty({ 
    description: 'Materials and cost for crafting',
    example: { materials: [], zenny: 500 }
  })
  crafting: any;
}

export class CharmRankEntity extends CharmEntity {
  @ApiProperty({ 
    example: 3, 
    description: 'Level/rank of the charm' 
  })
  level: number;

  @ApiProperty({ 
    description: 'Base charm information',
    example: { id: 1, gameId: 101 }
  })
  charm: {
    id: number;
    gameId: number;
  };
}