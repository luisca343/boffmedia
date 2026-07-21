import { ApiProperty } from '@nestjs/swagger';

export class DungeonRankingEntry {
  @ApiProperty({ description: 'Rank position', example: 1 })
  rank: number;

  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  uuid: string;

  @ApiProperty({
    description: 'Most recent name seen for this player',
    example: 'Ana',
  })
  nombre: string;

  @ApiProperty({ description: 'Runs played', example: 12 })
  partidas: number;

  @ApiProperty({ description: 'Runs completed', example: 4 })
  completadas: number;

  @ApiProperty({ description: 'Highest stage reached', example: 5 })
  mejorEtapa: number;

  @ApiProperty({ description: 'Most floors cleared in a run', example: 9 })
  mejorPisos: number;

  @ApiProperty({
    description:
      'Fastest completed run in milliseconds; null if never completed',
    example: 725000,
    // Explicit: reflection cannot see through `number | null`, and without it the
    // generated shared type comes out as an object.
    type: Number,
    nullable: true,
  })
  mejorTiempoMs: number | null;

  @ApiProperty({ description: 'Total deaths', example: 21 })
  muertes: number;

  @ApiProperty({ description: 'Runs abandoned', example: 2 })
  abandonos: number;
}
