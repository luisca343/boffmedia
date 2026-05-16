import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsArray, IsNumber } from 'class-validator';

export class UpdateDexDto extends BaseDto {
  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Array of seen Pokémon IDs',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  SEEN: number[];

  @ApiProperty({
    description: 'Array of caught Pokémon IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  CAUGHT: number[];
}
