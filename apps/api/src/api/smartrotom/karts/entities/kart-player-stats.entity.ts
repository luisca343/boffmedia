import { ApiProperty } from '@nestjs/swagger';

export class KartCircuitBest {
  @ApiProperty({ description: 'Circuit name', example: 'Rainbow Road' })
  circuito: string;

  @ApiProperty({ description: 'Races run on this circuit', example: 7 })
  carreras: number;

  @ApiProperty({
    description:
      'Best full-distance clasica time in milliseconds; null if never set one',
    example: 90500,
    type: Number,
    nullable: true,
  })
  mejorTiempoMs: number | null;

  @ApiProperty({
    description: 'Best lap in milliseconds; null if no lap was ever completed',
    example: 29800,
    type: Number,
    nullable: true,
  })
  mejorVueltaMs: number | null;
}

export class KartPlayerStats {
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

  @ApiProperty({ description: 'Races entered', example: 21 })
  carreras: number;

  @ApiProperty({ description: 'Races won', example: 4 })
  victorias: number;

  @ApiProperty({ description: 'Top-three finishes', example: 11 })
  podios: number;

  @ApiProperty({ description: 'Races retired from', example: 2 })
  abandonos: number;

  @ApiProperty({ description: 'Per-circuit bests', type: [KartCircuitBest] })
  circuitos: KartCircuitBest[];
}
