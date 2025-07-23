import { ApiProperty } from '@nestjs/swagger';

export class TcgCardAttack {
  @ApiProperty({ example: ['Grass', 'Colorless'], description: 'Energy cost for the attack' })
  cost: string[];

  @ApiProperty({ example: 'Vine Whip', description: 'Attack name' })
  name: string;

  @ApiProperty({ example: '40', description: 'Attack damage' })
  damage: string;
}

export class TcgCardWeakness {
  @ApiProperty({ example: 'Fire', description: 'Weakness type' })
  type: string;

  @ApiProperty({ example: '+20', description: 'Weakness value' })
  value: string;
}

export class TcgCardVariants {
  @ApiProperty({ example: false, description: 'First edition variant' })
  firstEdition: boolean;

  @ApiProperty({ example: true, description: 'Holo variant' })
  holo: boolean;

  @ApiProperty({ example: true, description: 'Normal variant' })
  normal: boolean;

  @ApiProperty({ example: true, description: 'Reverse variant' })
  reverse: boolean;

  @ApiProperty({ example: false, description: 'W Promo variant' })
  wPromo: boolean;
}

export class TcgCardLegal {
  @ApiProperty({ example: false, description: 'Legal in standard format' })
  standard: boolean;

  @ApiProperty({ example: false, description: 'Legal in expanded format' })
  expanded: boolean;
}

export class TcgCardBooster {
  @ApiProperty({ example: 'boo_A1-mewtwo', description: 'Booster ID' })
  id: string;

  @ApiProperty({ example: 'Mewtwo', description: 'Booster name' })
  name: string;
}

export class TcgCard {
  @ApiProperty({ example: 'tcgp-A1-001', description: 'Card ID' })
  id: string;

  @ApiProperty({ example: 'A1', description: 'Set ID' })
  setId: string;
  
  @ApiProperty({ example: 'Genetic Apex', description: 'Set name (localized)' })
  setName: string;

  @ApiProperty({ example: '001', description: 'Local ID within set' })
  localId: string;

  @ApiProperty({ example: 'Pikachu', description: 'Card name' })
  name: string;

  @ApiProperty({ example: '/img/games/tcg/cards/A1/tcgp-A1-001_en.webp', description: 'Card image URL', required: false })
  image?: string;

  @ApiProperty({ example: 'Pokemon', description: 'Card category' })
  category: string;

  @ApiProperty({ example: 'Atsuko Nishida', description: 'Card illustrator', required: false })
  illustrator?: string;

  @ApiProperty({ example: 'Common', description: 'Card rarity' })
  rarity: string;

  @ApiProperty({ example: 60, description: 'Pokemon HP', required: false })
  hp?: number;

  @ApiProperty({ example: 'Basic', description: 'Pokemon stage', required: false })
  stage?: string;

  @ApiProperty({ example: 'A lightning-fast Pokemon...', description: 'Card description', required: false })
  description?: string;

  @ApiProperty({ example: '2023-12-01T00:00:00Z', description: 'Last updated timestamp' })
  updated: string;

  // New complex fields
  @ApiProperty({ 
    example: ['Grass'], 
    description: 'Pokemon types',
    type: [String],
    required: false 
  })
  types?: string[];

  @ApiProperty({ 
    description: 'Pokemon weaknesses',
    type: [TcgCardWeakness],
    required: false 
  })
  weaknesses?: TcgCardWeakness[];

  @ApiProperty({ 
    description: 'Pokemon attacks',
    type: [TcgCardAttack],
    required: false 
  })
  attacks?: TcgCardAttack[];

  @ApiProperty({ 
    description: 'Boosters containing this card',
    type: [TcgCardBooster],
    required: false 
  })
  boosters?: TcgCardBooster[];

  @ApiProperty({ 
    description: 'Card variants',
    type: TcgCardVariants,
    required: false 
  })
  variants?: TcgCardVariants;

  @ApiProperty({ 
    description: 'Format legality',
    type: TcgCardLegal,
    required: false 
  })
  legal?: TcgCardLegal;

  @ApiProperty({ example: 1, description: 'Retreat cost', required: false })
  retreat?: number;
}
