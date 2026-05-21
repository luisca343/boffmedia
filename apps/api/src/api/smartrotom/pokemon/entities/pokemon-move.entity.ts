import { ApiProperty } from '@nestjs/swagger';

export class Move {
  @ApiProperty({
    description: 'Move name',
    example: 'Thunderbolt',
  })
  attackName: string;

  @ApiProperty({
    description: 'Move type',
    example: 'electric',
  })
  attackType: string;

  @ApiProperty({
    description: 'Move category',
    example: 'special',
  })
  attackCategory: string;

  @ApiProperty({
    description: 'Base power',
    example: 90,
  })
  basePower: number;

  @ApiProperty({
    description: 'Base PP',
    example: 15,
  })
  ppBase: number;

  @ApiProperty({
    description: 'Maximum PP',
    example: 24,
  })
  ppMax: number;

  @ApiProperty({
    description: 'Accuracy percentage',
    example: 100,
  })
  accuracy: number;
}

export class MoveEffect {
  @ApiProperty({
    description: 'Effect type',
    example: 'Paralysis',
  })
  type: string;

  @ApiProperty({
    description: 'Effect modifiers',
    type: [Object],
    example: [{ type: 'Chance', value: 10 }],
  })
  modifiers: Array<{ type: string; value: number }>;

  @ApiProperty({
    description: 'Whether effect persists',
    example: false,
  })
  persists: boolean;

  @ApiProperty({
    description: 'Effect type ID',
    example: 'Paralysis',
  })
  effectTypeID: string;
}

export class MoveTargetingInfo {
  @ApiProperty({
    description: 'Hits all targets',
    example: false,
  })
  hitsAll: boolean;

  @ApiProperty({
    description: 'Hits opposite foe',
    example: true,
  })
  hitsOppositeFoe: boolean;

  @ApiProperty({
    description: 'Hits adjacent foe',
    example: true,
  })
  hitsAdjacentFoe: boolean;

  @ApiProperty({
    description: 'Hits extended foe',
    example: false,
  })
  hitsExtendedFoe: boolean;

  @ApiProperty({
    description: 'Hits self',
    example: false,
  })
  hitsSelf: boolean;

  @ApiProperty({
    description: 'Hits adjacent ally',
    example: true,
  })
  hitsAdjacentAlly: boolean;

  @ApiProperty({
    description: 'Hits extended ally',
    example: false,
  })
  hitsExtendedAlly: boolean;
}

export class ZMove {
  @ApiProperty({
    description: 'Z-Crystal required',
    example: 'electrium_z',
  })
  crystal: string;

  @ApiProperty({
    description: 'Z-Move name',
    example: 'Gigavolt Havoc',
  })
  attackName: string;

  @ApiProperty({
    description: 'Z-Move base power',
    example: 175,
  })
  basePower: number;

  @ApiProperty({
    description: 'Z-Move effects',
    type: [Object],
    example: [],
  })
  effects: any[];

  @ApiProperty({
    description: 'Pokémon allowed to use this Z-Move',
    type: [String],
    example: ['Pikachu'],
  })
  allowedPokemon: string[];
}

export class FullMove {
  @ApiProperty({
    description: 'Attack index',
    example: 122,
  })
  attackIndex: number;

  @ApiProperty({
    description: 'Move name',
    example: 'Thunderbolt',
  })
  attackName: string;

  @ApiProperty({
    description: 'Move type',
    example: 'ELECTRIC',
  })
  attackType: string;

  @ApiProperty({
    description: 'Move category',
    example: 'SPECIAL',
    enum: ['PHYSICAL', 'SPECIAL', 'STATUS'],
  })
  attackCategory: string;

  @ApiProperty({
    description: 'Base power',
    example: 90,
  })
  basePower: number;

  @ApiProperty({
    description: 'Base PP',
    example: 15,
  })
  ppBase: number;

  @ApiProperty({
    description: 'Maximum PP',
    example: 24,
  })
  ppMax: number;

  @ApiProperty({
    description: 'Accuracy percentage',
    example: 100,
  })
  accuracy: number;

  @ApiProperty({
    description: 'Whether move makes contact',
    example: false,
  })
  makesContact: boolean;

  @ApiProperty({
    description: 'Move effects',
    type: [MoveEffect],
    example: [
      {
        type: 'Paralysis',
        modifiers: [{ type: 'Chance', value: 10 }],
        persists: false,
        effectTypeID: 'Paralysis',
      },
    ],
  })
  effects: MoveEffect[];

  @ApiProperty({
    description: 'Move animations',
    type: [String],
    example: ['leapForward'],
  })
  animations: string[];

  @ApiProperty({
    description: 'Targeting information',
    type: MoveTargetingInfo,
  })
  targetingInfo: MoveTargetingInfo;

  @ApiProperty({
    description: 'Z-Move variants',
    type: [ZMove],
    example: [
      {
        crystal: 'electrium_z',
        attackName: 'Gigavolt Havoc',
        basePower: 175,
        effects: [],
        allowedPokemon: [],
      },
    ],
  })
  z: ZMove[];
}

export class MoveCount {
  @ApiProperty({
    description: 'Move name',
    example: 'Rest',
  })
  name: string;

  @ApiProperty({
    description: 'Number of Pokémon that can learn this move',
    example: 1202,
  })
  count: number;

  @ApiProperty({
    description: 'Move type',
    example: 'ELECTRIC',
    required: false,
  })
  attackType?: string;

  @ApiProperty({
    description: 'Move category',
    example: 'SPECIAL',
    required: false,
  })
  attackCategory?: string;

  @ApiProperty({
    description: 'Base power',
    example: 90,
    required: false,
  })
  basePower?: number;
}

export class PokemonMoveData {
  @ApiProperty({
    description: 'Move name',
    example: 'Thunderbolt',
  })
  name: string;

  @ApiProperty({
    description: 'Move type',
    example: 'ELECTRIC',
  })
  type: string;

  @ApiProperty({
    description: 'Move category',
    example: 'SPECIAL',
    enum: ['PHYSICAL', 'SPECIAL', 'STATUS'],
  })
  category: string;

  @ApiProperty({
    description: 'Move power',
    example: 90,
  })
  power: number;

  @ApiProperty({
    description: 'PP range',
    example: '15 - 24',
  })
  pp: string;

  @ApiProperty({
    description: 'Accuracy percentage (-1 means always hits)',
    example: 100,
  })
  accuracy: number;
}

export class PokemonLearnset {
  @ApiProperty({
    description: 'Moves learned by leveling up',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Ember: {
        name: 'Ember',
        type: 'FIRE',
        category: 'SPECIAL',
        power: 40,
        pp: '25 - 40',
        accuracy: 100,
      },
      'Tail Whip': {
        name: 'Tail Whip',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '30 - 48',
        accuracy: 100,
      },
    },
  })
  levelUpMoves: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'Moves learned from tutors',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      'Burning Jealousy': {
        name: 'Burning Jealousy',
        type: 'FIRE',
        category: 'SPECIAL',
        power: 70,
        pp: '5 - 8',
        accuracy: 100,
      },
    },
  })
  tutorMoves?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'Moves learned from breeding',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      'Baby-Doll Eyes': {
        name: 'Baby-Doll Eyes',
        type: 'FAIRY',
        category: 'STATUS',
        power: 0,
        pp: '30 - 48',
        accuracy: 100,
      },
    },
  })
  eggMoves?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 8',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      'Fire Spin': {
        name: 'Fire Spin',
        type: 'FIRE',
        category: 'SPECIAL',
        power: 35,
        pp: '15 - 24',
        accuracy: 85,
      },
    },
  })
  tmMoves8?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TR moves (Technical Records)',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      'Body Slam': {
        name: 'Body Slam',
        type: 'NORMAL',
        category: 'PHYSICAL',
        power: 85,
        pp: '15 - 24',
        accuracy: 100,
      },
    },
  })
  trMoves?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'HM moves (Hidden Machines)',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {},
  })
  hmMoves?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'Transfer moves from other games',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Bide: {
        name: 'Bide',
        type: 'NORMAL',
        category: 'PHYSICAL',
        power: 0,
        pp: '10 - 16',
        accuracy: -1,
      },
    },
  })
  transferMoves?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 7',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Roar: {
        name: 'Roar',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '20 - 32',
        accuracy: -1,
      },
    },
  })
  tmMoves7?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 6',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Roar: {
        name: 'Roar',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '20 - 32',
        accuracy: -1,
      },
    },
  })
  tmMoves6?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 5',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Roar: {
        name: 'Roar',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '20 - 32',
        accuracy: -1,
      },
    },
  })
  tmMoves5?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 4',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Roar: {
        name: 'Roar',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '20 - 32',
        accuracy: -1,
      },
    },
  })
  tmMoves4?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 3',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Roar: {
        name: 'Roar',
        type: 'NORMAL',
        category: 'STATUS',
        power: 0,
        pp: '20 - 32',
        accuracy: -1,
      },
    },
  })
  tmMoves3?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 2',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Headbutt: {
        name: 'Headbutt',
        type: 'NORMAL',
        category: 'PHYSICAL',
        power: 70,
        pp: '15 - 24',
        accuracy: 100,
      },
    },
  })
  tmMoves2?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'TM moves from Generation 1',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {
      Toxic: {
        name: 'Toxic',
        type: 'POISON',
        category: 'STATUS',
        power: 0,
        pp: '10 - 16',
        accuracy: 90,
      },
    },
  })
  tmMoves1?: { [moveName: string]: PokemonMoveData };

  @ApiProperty({
    description: 'Current generation TM moves',
    type: 'object',
    additionalProperties: { type: 'object' },
    example: {},
  })
  tmMoves?: { [moveName: string]: PokemonMoveData };
}

export class PokemonMoveEntry {
  @ApiProperty({
    description: 'Pokémon species ID',
    example: 19,
  })
  speciesID: number;

  @ApiProperty({
    description: 'Pokémon form',
    example: 'base',
  })
  form: string;
}
