import { ApiProperty } from '@nestjs/swagger';

/**
 * One row per player — their best full-distance `clasica` run. Rows where `dnf` is true,
 * or where the racer did not cover the set distance, never reach this entity.
 */
export class KartRankingEntry {
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

  @ApiProperty({
    description: 'Circuit the time was set on',
    example: 'Rainbow Road',
  })
  circuito: string;

  @ApiProperty({
    description: 'Best full-distance time in milliseconds',
    example: 90500,
  })
  tiempoMs: number;

  @ApiProperty({
    description:
      'Best lap seen for this player on this circuit; null if none recorded',
    example: 29800,
    // Explicit: reflection cannot see through `number | null`, and without it the
    // generated shared type comes out as an object.
    type: Number,
    nullable: true,
  })
  mejorVueltaMs: number | null;

  @ApiProperty({ description: 'Laps the race was set to', example: 3 })
  vueltas: number;

  @ApiProperty({ description: 'When the time was set' })
  fecha: Date;
}
