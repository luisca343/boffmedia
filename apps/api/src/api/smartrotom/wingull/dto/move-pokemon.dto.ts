import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, IsUUID, Min } from 'class-validator';
import { BaseDto } from '@api/_utils/dto/base.dto';

/**
 * Single-swap PC move. The game server offers exactly one write: swap the
 * occupant of a source slot with a destination slot. Box `-1` is the party
 * (the game server's own convention), so box numbers floor at -1.
 */
export class MovePokemonDto extends BaseDto {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  uuid: string;

  @ApiProperty({ description: 'Source box (-1 = party)', example: 1 })
  @IsInt()
  @Min(-1)
  sourceBox: number;

  @ApiProperty({ description: 'Source slot index within the box', example: 0 })
  @IsInt()
  @Min(0)
  sourceIndex: number;

  @ApiProperty({ description: 'Destination box (-1 = party)', example: 1 })
  @IsInt()
  @Min(-1)
  destinationBox: number;

  @ApiProperty({
    description: 'Destination slot index within the box',
    example: 1,
  })
  @IsInt()
  @Min(0)
  destinationIndex: number;
}
