import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReplayFullDto extends BaseDto {
  @ApiProperty({
    description: 'Player 1 name',
    example: 'Luisca343',
  })
  @IsNotEmpty()
  @IsString()
  side1: string;

  @ApiProperty({
    description: 'Player 2 name',
    example: 'Aquiles',
  })
  @IsNotEmpty()
  @IsString()
  side2: string;

  @ApiProperty({
    description: 'Player 1 team data',
    example: '{"pokemon": [...]}',
  })
  @IsNotEmpty()
  @IsString()
  team1: string;

  @ApiProperty({
    description: 'Player 2 team data',
    example: '{"pokemon": [...]}',
  })
  @IsNotEmpty()
  @IsString()
  team2: string;

  @ApiProperty({
    description: 'Replay data',
    example: '|start|...',
  })
  @IsNotEmpty()
  @IsString()
  replay: string;

  @ApiProperty({
    description: 'Winner name',
    example: 'Luisca343',
  })
  @IsNotEmpty()
  @IsString()
  winner: string;
}
