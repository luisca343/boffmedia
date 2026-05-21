import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetPokemonImageDto extends BaseDto {
  @ApiProperty({
    description: 'Pokémon ID',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  pokemonId: number;

  @ApiProperty({
    description: 'Form name',
    example: 'base',
  })
  @IsString()
  formName: string;

  @ApiProperty({
    description: 'Palette name',
    example: 'none',
  })
  @IsString()
  paletteName: string;

  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Image type',
    example: 'img',
    required: false,
    enum: ['img', 'sprite'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['img', 'sprite'])
  type?: string;

  @ApiProperty({
    description: 'Hide parameter',
    example: 0,
    required: false,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsIn([0, 1])
  hide?: number;
}
