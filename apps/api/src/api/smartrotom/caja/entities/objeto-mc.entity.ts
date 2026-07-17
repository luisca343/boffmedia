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

/**
 * The claim response. `objetos` sits at the ROOT — the route opts out of the
 * global `{success, statusCode, data}` envelope with `@SkipEnvelope()` because
 * the mod parses this key off the top level.
 */
export class ClaimCajaResponse {
  @ApiProperty({ type: [ObjetoMC] })
  objetos: ObjetoMC[];
}
