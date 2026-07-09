import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class EvolutionMethod {
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
    type: [String],
    example: [],
  })
  conditions: string[];

  @ApiProperty({
    description: 'Required item for evolution',
    required: false,
    example: { itemID: 'pixelmon:fire_stone' },
  })
  item?: {
    itemID: string;
  };

  @ApiProperty({
    description: 'Moves learned upon evolution',
    type: [String],
    required: false,
    example: ['Dazzling Gleam'],
  })
  moves?: string[];
}

export class EvolutionNode {
  @ApiProperty({
    description: 'Pokémon name',
    example: 'Vulpix',
  })
  pkm: string;

  @ApiProperty({
    description: 'Pokédex number',
    example: 37,
  })
  dex: number;

  @ApiProperty({
    description: 'Form index',
    example: 1,
    type: Number,
    nullable: true,
    required: false,
  })
  index?: number | null;

  @ApiProperty({
    description: 'Evolution methods',
    type: [EvolutionMethod],
    required: false,
  })
  methods?: EvolutionMethod[];

  @ApiProperty({
    description: 'Child evolutions',
    type: 'object',
    additionalProperties: { $ref: '#/components/schemas/EvolutionNode' },
    example: {},
  })
  evos: { [key: string]: EvolutionNode };
}

export class EvolutionTree {
  @ApiProperty({
    description: 'Maximum depth of the evolution tree',
    example: 2,
  })
  depth: number;

  @ApiProperty({
    description: 'Evolution tree structure',
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(EvolutionNode) },
    example: {
      Vulpix_base: {
        pkm: 'Vulpix',
        dex: 37,
        index: null,
        evos: {
          ninetales_base: {
            pkm: 'ninetales',
            dex: 38,
            index: 1,
            evos: {},
            methods: [
              {
                item: { itemID: 'pixelmon:fire_stone' },
                to: 'Ninetales form:base',
                conditions: [],
                evoType: 'interact',
              },
            ],
          },
        },
      },
    },
  })
  tree: { [key: string]: EvolutionNode };
}
