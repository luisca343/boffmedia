import { ApiProperty } from '@nestjs/swagger';

/**
 * One item stack as the Minecraft mod expects it. Field names are the mod's wire
 * contract (`ObjetoMC`), not this API's naming — do not rename them.
 */
export class ObjetoMC {
  @ApiProperty({ description: 'Minecraft item id', example: 'minecraft:diamond' })
  id: string;

  @ApiProperty({ description: 'How many to grant', example: 5 })
  cantidad: number;
}

/** A Pokémon to give to the player's party, by spec. Distinct from ObjetoMC: a mon is not a stack. */
export class PokemonMC {
  @ApiProperty({ description: 'Pokémon spec string', example: 'Incineroar lvl:50 otn:Wolfey' })
  spec: string;

  @ApiProperty({ description: 'How many to give', example: 1 })
  cantidad: number;
}

/**
 * The claim response. Both keys sit at the ROOT — the route opts out of the
 * global `{success, statusCode, data}` envelope with `@SkipEnvelope()`.
 * `objetos` are chested; `pokemon` go to the party — the mod delivers them
 * differently, so they cannot share one list. `pokemon` is empty for item-only
 * sources (e.g. mine), so an old handler that reads only `objetos` still works.
 */
export class ClaimCajaResponse {
  @ApiProperty({ type: [ObjetoMC] })
  objetos: ObjetoMC[];

  @ApiProperty({ type: [PokemonMC] })
  pokemon: PokemonMC[];
}
