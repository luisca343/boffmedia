import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumberString, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPokemonByDexDto extends BaseDto {
  @ApiProperty({
    description: 'Pokédex number',
    example: 1,
  })
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  dex: number;
}

export class SearchPokemonDto extends BaseDto {
  @ApiProperty({
    description: 'Search term',
    example: 'pikachu',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Number of results to return',
    example: 16,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  amount?: number = 16;
}

export class GetPokemonMovesDto extends BaseDto {
  @ApiProperty({
    description: 'Pokémon ID',
    example: 1,
  })
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(1)
  id: number;

  @ApiProperty({
    description: 'Form index',
    example: 0,
  })
  @IsNumberString()
  @Transform(({ value }) => parseInt(value, 10))
  @Min(0)
  form: number;
}
