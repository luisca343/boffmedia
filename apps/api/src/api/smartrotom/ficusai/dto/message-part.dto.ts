import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export enum MessagePartType {
  TEXT = 'text',
  POKEMON_DATA = 'pokemonData',
  POKEMON_TYPES = 'pokemonTypes',
  POKEMON_STATS = 'pokemonStats',
  POKEMON_MOVES = 'pokemonMoves',
  POKEMON_HABITAT = 'pokemonHabitat',
  RANDOM_POKEMON = 'randomPokemon',
  POKEMON_COUNT = 'pokemonCount',
}

export class MessagePartDto {
  @ApiProperty({
    description: 'Type of the message part',
    example: MessagePartType.TEXT,
    enum: MessagePartType,
    enumName: 'MessagePartType',
  })
  @IsString()
  @IsNotEmpty()
  @IsEnum(MessagePartType)
  type: MessagePartType;

  @ApiProperty({
    description: 'Content of the message part',
    example: 'Hello, how can I help you?',
  })
  @IsNotEmpty()
  content: any;
}
