import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class PcMark {
  @ApiProperty({ example: 1, description: 'Unique identifier for the mark' })
  @IsInt()
  id: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'SmartRotom user UUID the mark belongs to',
  })
  @IsString()
  uuid: string;

  @ApiProperty({
    example: '25|0|adamant|static|31,31,31,31,31,31',
    description:
      'Opaque content hash identifying the Pokémon (dex|palette|nature|ability|ivs). Computed by the client; never validated by the API.',
  })
  @IsString()
  pokemonKey: string;

  @ApiProperty({
    example: true,
    description: 'Whether the Pokémon is favourited',
  })
  @IsBoolean()
  favorite: boolean;

  @ApiProperty({
    type: String,
    isArray: true,
    example: ['competitivo', 'shiny'],
    description: 'User-defined tags for the Pokémon',
  })
  @IsArray()
  tags: string[];

  @ApiProperty({
    example: '2026-07-13T10:00:00Z',
    description: 'Record creation date',
    required: false,
  })
  @IsOptional()
  createdAt?: Date;

  @ApiProperty({
    example: '2026-07-13T10:00:00Z',
    description: 'Record last update date',
    required: false,
  })
  @IsOptional()
  updatedAt?: Date;
}
