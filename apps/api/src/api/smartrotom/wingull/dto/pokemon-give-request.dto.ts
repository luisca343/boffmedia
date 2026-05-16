import { ApiProperty } from '@nestjs/swagger';

export class PokemonGiveRequestDto {
  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  uuid: string;

  @ApiProperty({ example: 'pikachu shiny', description: 'Pokémon spec string' })
  pokespec: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Send message to player',
  })
  sendMessage?: boolean;
}
