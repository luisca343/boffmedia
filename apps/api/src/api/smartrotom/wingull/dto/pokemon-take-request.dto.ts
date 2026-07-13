import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';

// The take-side of the game-server bridge, which does NOT EXIST YET on the plugin.
// The Pixelmon server currently exposes only /pc/move as a write against a player's PC —
// there is no way to remove a Pokémon from one player and hand it to another. Wigglypop is
// built against this agreed contract; until the plugin ships it, these calls 404 and
// WIGGLYPOP_ATOMIC_CUSTODY stays false (see WigglypopCustodyService).
//
//   POST /takepokemon { uuid, box, index, expectedKey } -> { pokespec }
//
// `expectedKey` is the content hash the PC app computes (dex|palette|nature|ability|ivs).
// The plugin MUST refuse the take if the slot no longer matches it — that is the whole
// safety property: it makes "sell the mon you listed" impossible to race by moving the PC
// around between listing and settlement.
//
// Deliberately not a BaseDto: /wingull routes are the game-server bridge and sit
// outside MinecraftMiddleware's /smartrotom scope, so no `server` field arrives.
export class PokemonTakeRequestDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 0, description: 'PC box the Pokémon sits in' })
  @IsInt()
  @Min(0)
  box: number;

  @ApiProperty({ example: 5, description: 'Slot index within the box' })
  @IsInt()
  @Min(0)
  index: number;

  @ApiProperty({
    example: '1k3j9fz',
    description:
      'Content hash of the expected Pokémon. The plugin refuses the take if the slot no longer matches.',
  })
  @IsString()
  @IsNotEmpty()
  expectedKey: string;
}

export class PokemonTakeResponse {
  @ApiProperty({
    example: 'pikachu shiny lvl:50',
    description:
      'The pokespec of the Pokémon that was actually removed — replay it into /givepokemon to hand it to the buyer.',
  })
  pokespec: string;
}
