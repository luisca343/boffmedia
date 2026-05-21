import { ApiProperty } from '@nestjs/swagger';

export class PokemonDimensions {
  @ApiProperty({
    description: 'Height in meters',
    example: 0.5,
  })
  height: number;

  @ApiProperty({
    description: 'Width in meters',
    example: 0.4,
  })
  width: number;

  @ApiProperty({
    description: 'Length in meters',
    example: 1.0,
  })
  length: number;

  @ApiProperty({
    description: 'Eye height in meters',
    example: 0.5,
    required: false,
  })
  eyeHeight?: number;

  @ApiProperty({
    description: 'Hover height in meters',
    example: 0.5,
    required: false,
  })
  hoverHeight?: number;
}

export class PokemonAbilities {
  @ApiProperty({
    description: 'Regular abilities',
    example: ['FlashFire'],
    type: [String],
  })
  abilities: string[];

  @ApiProperty({
    description: 'Hidden abilities',
    example: ['Drought'],
    type: [String],
    required: false,
  })
  hiddenAbilities?: string[];
}

export class PokemonBattleStats {
  @ApiProperty({
    description: 'HP stat',
    example: 38,
  })
  hp: number;

  @ApiProperty({
    description: 'Attack stat',
    example: 41,
  })
  attack: number;

  @ApiProperty({
    description: 'Defense stat',
    example: 40,
  })
  defense: number;

  @ApiProperty({
    description: 'Special Attack stat',
    example: 50,
  })
  specialAttack: number;

  @ApiProperty({
    description: 'Special Defense stat',
    example: 65,
  })
  specialDefense: number;

  @ApiProperty({
    description: 'Speed stat',
    example: 65,
  })
  speed: number;
}

export class PokemonEvolution {
  @ApiProperty({
    description: 'Evolution target',
    example: 'Ninetales form:base',
  })
  to: string;

  @ApiProperty({
    description: 'Evolution type',
    example: 'interact',
  })
  evoType: string;

  @ApiProperty({
    description: 'Evolution conditions',
    required: false,
  })
  conditions?: any[];

  @ApiProperty({
    description: 'Required item for evolution',
    required: false,
  })
  item?: { itemID: string };

  @ApiProperty({
    description: 'Moves learned upon evolution',
    type: [String],
    required: false,
  })
  moves?: string[];
}

export class PokemonModelLocator {
  @ApiProperty({
    description: 'Factory type',
    example: 'NORMAL',
  })
  factoryType: string;

  @ApiProperty({
    description: 'PQC files',
    type: [String],
    example: ['pixelmon:pokemon/037_vulpix/all/base/none/model.pqc'],
  })
  pqc: string[];
}

export class PokemonPalette {
  @ApiProperty({
    description: 'Palette name',
    example: 'none',
  })
  name: string;

  @ApiProperty({
    description: 'Texture path',
    example: 'pixelmon:pokemon/037_vulpix/all/base/none/texture.png',
  })
  texture: string;

  @ApiProperty({
    description: 'Sprite path',
    example: 'pixelmon:pokemon/037_vulpix/all/base/none/sprite.png',
    required: false,
  })
  sprite?: string;

  @ApiProperty({
    description: 'Particle effect',
    example: 'arcanery:shiny',
    required: false,
  })
  particle?: string;

  @ApiProperty({
    description: 'Emissive texture path',
    required: false,
  })
  emissive?: string;

  @ApiProperty({
    description: 'Model locator',
    type: PokemonModelLocator,
    required: false,
  })
  modelLocator?: PokemonModelLocator;

  @ApiProperty({
    description: 'Sound effects',
    type: [String],
    required: false,
  })
  sounds?: string[];
}

export class PokemonGenderProperties {
  @ApiProperty({
    description: 'Gender',
    example: 'ALL',
    required: false, // Add this line
  })
  gender?: string; // Make this optional

  @ApiProperty({
    description: 'Available palettes',
    type: [PokemonPalette],
  })
  palettes: PokemonPalette[];
}

export class PokemonMovement {
  @ApiProperty({
    description: 'Can be ridden',
    example: false,
  })
  rideable: boolean;

  @ApiProperty({
    description: 'Can fly',
    example: false,
  })
  canFly: boolean;

  @ApiProperty({
    description: 'Can surf',
    example: false,
  })
  canSurf: boolean;

  @ApiProperty({
    description: 'Can ride on shoulder',
    example: false,
  })
  canRideShoulder: boolean;
}

export class PokemonAggression {
  @ApiProperty({
    description: 'Timid percentage',
    example: 80,
  })
  timid: number;

  @ApiProperty({
    description: 'Passive percentage',
    example: 0,
  })
  passive: number;

  @ApiProperty({
    description: 'Aggressive percentage',
    example: 20,
  })
  aggressive: number;
}

export class PokemonSpawn {
  @ApiProperty({
    description: 'Base experience points',
    example: 63,
  })
  baseExp: number;

  @ApiProperty({
    description: 'Base friendship level',
    example: 70,
  })
  baseFriendship: number;

  @ApiProperty({
    description: 'Spawn level',
    example: 10,
  })
  spawnLevel: number;

  @ApiProperty({
    description: 'Spawn level range',
    example: 9,
  })
  spawnLevelRange: number;

  @ApiProperty({
    description: 'Spawn locations',
    type: [String],
    example: ['LAND'],
  })
  spawnLocations: string[];
}

export class PokemonGigantamax {
  @ApiProperty({
    description: 'Can have Gigantamax factor',
    example: false,
  })
  canHaveFactor: boolean;

  @ApiProperty({
    description: 'Can Gigantamax',
    example: false,
  })
  canGigantamax: boolean;
}

export class PokemonEvYields {
  @ApiProperty({
    description: 'HP EV yield',
    required: false,
  })
  hp?: number;

  @ApiProperty({
    description: 'Attack EV yield',
    required: false,
  })
  attack?: number;

  @ApiProperty({
    description: 'Defense EV yield',
    required: false,
  })
  defense?: number;

  @ApiProperty({
    description: 'Special Attack EV yield',
    required: false,
  })
  specialAttack?: number;

  @ApiProperty({
    description: 'Special Defense EV yield',
    required: false,
  })
  specialDefense?: number;

  @ApiProperty({
    description: 'Speed EV yield',
    example: 1,
    required: false,
  })
  speed?: number;
}

export class PokemonForm {
  @ApiProperty({
    description: 'Form name',
    example: 'base',
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Experience group',
    example: 'MEDIUM_FAST',
    required: false,
  })
  experienceGroup?: string;

  @ApiProperty({
    description: 'Pokémon types',
    example: ['FIRE'],
    type: [String],
  })
  types: string[];

  @ApiProperty({
    description: 'Pokémon dimensions',
    type: PokemonDimensions,
    required: false,
  })
  dimensions?: PokemonDimensions;

  @ApiProperty({
    description: 'Weight in kilograms',
    example: 9.9,
    required: false,
  })
  weight?: number;

  @ApiProperty({
    description: 'Pokémon abilities',
    type: PokemonAbilities,
    required: false,
  })
  abilities?: PokemonAbilities;

  @ApiProperty({
    description: 'Pokémon moves by category',
    required: false,
  })
  moves?: { [key: string]: any };

  @ApiProperty({
    description: 'Movement capabilities',
    type: PokemonMovement,
    required: false,
  })
  movement?: PokemonMovement;

  @ApiProperty({
    description: 'Aggression stats',
    type: PokemonAggression,
    required: false,
  })
  aggression?: PokemonAggression;

  @ApiProperty({
    description: 'Battle stats',
    type: PokemonBattleStats,
    required: false,
  })
  battleStats?: PokemonBattleStats;

  @ApiProperty({
    description: 'Tags',
    type: [String],
    required: false,
  })
  tags?: string[];

  @ApiProperty({
    description: 'Spawn information',
    type: PokemonSpawn,
    required: false,
  })
  spawn?: PokemonSpawn;

  @ApiProperty({
    description: 'Possible genders',
    type: [String],
    example: ['MALE', 'FEMALE'],
    required: false,
  })
  possibleGenders?: string[];

  @ApiProperty({
    description: 'Gender properties with palettes',
    type: [PokemonGenderProperties],
    required: false,
  })
  genderProperties?: PokemonGenderProperties[];

  @ApiProperty({
    description: 'Egg groups',
    type: [String],
    example: ['FIELD'],
    required: false,
  })
  eggGroups?: string[];

  @ApiProperty({
    description: 'Pre-evolution names',
    type: [String],
    required: false,
  })
  preEvolutions?: string[];

  @ApiProperty({
    description: 'Default base form',
    example: '',
    required: false,
  })
  defaultBaseForm?: string;

  @ApiProperty({
    description: 'Mega items',
    type: [String],
    required: false,
  })
  megaItems?: string[];

  @ApiProperty({
    description: 'Mega forms',
    required: false,
  })
  megas?: any[];

  @ApiProperty({
    description: 'Gigantamax information',
    type: PokemonGigantamax,
    required: false,
  })
  gigantamax?: PokemonGigantamax;

  @ApiProperty({
    description: 'Egg cycles',
    example: 21,
    required: false,
  })
  eggCycles?: number;

  @ApiProperty({
    description: 'Catch rate',
    example: 190,
    required: false,
  })
  catchRate?: number;

  @ApiProperty({
    description: 'Male percentage',
    example: 25,
    required: false,
  })
  malePercentage?: number;

  @ApiProperty({
    description: 'Possible evolutions',
    type: [PokemonEvolution],
    required: false,
  })
  evolutions?: PokemonEvolution[];

  @ApiProperty({
    description: 'EV yields',
    type: PokemonEvYields,
    required: false,
  })
  evYields?: PokemonEvYields;
}

export class Pokemon {
  @ApiProperty({
    description: 'Pokémon name',
    example: 'Vulpix',
  })
  name: string;

  @ApiProperty({
    description: 'Pokédex number',
    example: 37,
  })
  dex: number;

  @ApiProperty({
    description: 'Default form names',
    example: [''],
    type: [String],
  })
  defaultForms: string[];

  @ApiProperty({
    description: 'Available forms',
    type: [PokemonForm],
  })
  forms: PokemonForm[];

  @ApiProperty({
    description: 'Generation number',
    example: 1,
  })
  generation: number;

  @ApiProperty({
    description: 'Whether this is a custom Pokémon',
    example: false,
    required: false,
  })
  isCustom?: boolean;
}
