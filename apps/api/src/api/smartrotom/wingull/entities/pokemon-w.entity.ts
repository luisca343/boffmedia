import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PokemonW {
  @ApiProperty({ example: 777, description: 'Pokédex number' })
  dex: number;

  @ApiProperty({ example: 'Serious', description: 'Nature' })
  nature: string;

  @ApiProperty({ example: 'Togedemaru', description: 'Species' })
  species: string;

  @ApiPropertyOptional({ example: '', description: 'Form (if any)' })
  form?: string;

  @ApiPropertyOptional({ example: 'none', description: 'Palette (if any)' })
  palette?: string;

  @ApiProperty({ example: 'Togedemaru', description: 'Nickname or name' })
  name: string;

  @ApiProperty({ example: 100, description: 'Level' })
  level: number;

  @ApiProperty({ example: 'item.minecraft.air', description: 'Held item' })
  item: string;

  @ApiProperty({ example: 'Lightning Rod', description: 'Ability' })
  ability: string;

  // Left as `[String]`: OpenAPI cannot express a nullable *item*, and marking the
  // array itself nullable is a different (and wrong) claim. Empty move slots do
  // come back as null at runtime, so read them through `moveName()` in `derive.ts`.
  @ApiProperty({
    type: [String],
    example: ['Fake Out', 'Nuzzle', 'Thunderbolt', 'Spiky Shield'],
    description: 'Moveset (up to 4 moves)',
  })
  moves: (string | null)[];

  // `type: [Number]` is load-bearing on all three: an array @ApiProperty carrying
  // only an `example` gives the generator nothing to infer the item type from, so
  // it defaults to string and `@boffmedia/shared` ships these as `string[]` —
  // which silently turns every sum over them into string concatenation.
  @ApiProperty({
    type: [Number],
    example: [17, 10, 19, 30, 9, 23],
    description: 'IVs (HP, Atk, Def, SpA, SpD, Spe)',
  })
  ivs: number[];

  @ApiProperty({
    type: [Number],
    example: [252, 0, 3, 252, 3, 0],
    description: 'EVs (HP, Atk, Def, SpA, SpD, Spe)',
  })
  evs: number[];

  @ApiProperty({
    type: [Number],
    example: [320, 211, 150, 178, 160, 220],
    description: 'Stats (HP, Atk, Def, SpA, SpD, Spe)',
  })
  stats: number[];
}
