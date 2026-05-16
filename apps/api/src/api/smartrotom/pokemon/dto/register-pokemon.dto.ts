import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNumber, IsIn, Min } from 'class-validator';

export class RegisterPokemonDto extends BaseDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Pokémon ID',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  pokemonId: number;

  @ApiProperty({
    description: 'Form name',
    example: 'base',
  })
  @IsString()
  form: string;

  @ApiProperty({
    description: 'Palette name',
    example: 'none',
  })
  @IsString()
  palette: string;

  @ApiProperty({
    description: 'Status (0=seen, 1=caught)',
    example: 1,
    enum: [0, 1],
  })
  @IsNumber()
  @IsIn([0, 1])
  status: number;
}
