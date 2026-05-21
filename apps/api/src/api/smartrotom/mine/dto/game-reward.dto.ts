import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class GameRewardDto {
  @ApiProperty({
    description: 'Reward ID',
    example: 1,
  })
  @IsNumber()
  @Min(1)
  id: number;

  @ApiProperty({
    description: 'Reward value',
    example: 100,
  })
  @IsNumber()
  @Min(1)
  value: number;
}

export class EndGameDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({
    description: 'Array of rewards obtained in the game',
    type: [GameRewardDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GameRewardDto)
  rewards: GameRewardDto[];
}
