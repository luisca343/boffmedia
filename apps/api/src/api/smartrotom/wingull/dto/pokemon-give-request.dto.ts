import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class PokemonGiveRequestDto {
  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Player UUID',
  })
  @IsUUID()
  uuid: string;

  @ApiProperty({ example: 'pikachu shiny', description: 'Pokémon spec string' })
  @IsString()
  @IsNotEmpty()
  pokespec: string;

  @ApiProperty({
    example: true,
    required: false,
    description: 'Send message to player',
  })
  @IsBoolean()
  @IsOptional()
  sendMessage?: boolean;
}
