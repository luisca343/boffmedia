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

/**
 * A reservation: the same grant as a claim, plus the id the deliverer echoes back
 * to `confirm` once the items are in the player's hands. Nothing is spent yet —
 * `reservationId` is null exactly when both lists are empty (nothing was owed).
 */
export class ReserveCajaResponse extends ClaimCajaResponse {
  @ApiProperty({
    description:
      'Opaque id to pass to POST /caja/confirm after delivery. Null when nothing was owed.',
    nullable: true,
    example: '9b7c1f2e-3d4a-4b5c-8e9f-0a1b2c3d4e5f',
  })
  reservationId: string | null;
}

/** The result of finalizing a reservation: how many ledger rows were spent (0 on replay). */
export class ConfirmCajaResponse {
  @ApiProperty({
    description: 'Rows spent by this confirm. 0 means already confirmed, expired, or reclaimed.',
    example: 2,
  })
  confirmed: number;
}
