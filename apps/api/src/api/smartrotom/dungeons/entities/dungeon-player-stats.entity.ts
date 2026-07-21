import { ApiProperty } from '@nestjs/swagger';
import { DungeonRankingEntry } from './dungeon-ranking-entry.entity';

export class DungeonBestRun {
  @ApiProperty({ description: 'Stage the party started on', example: 1 })
  etapaInicial: number;

  @ApiProperty({ description: 'Stage the party reached', example: 4 })
  etapaFinal: number;

  @ApiProperty({ description: 'Floors cleared', example: 3 })
  pisosSuperados: number;

  @ApiProperty({ description: 'Whether the run was completed', example: true })
  completada: boolean;

  @ApiProperty({ description: 'Run duration in milliseconds', example: 725000 })
  duracionMs: number;

  @ApiProperty({ description: 'Curses active during the run', type: [String] })
  maldiciones: string[];

  @ApiProperty({ description: 'Run end timestamp' })
  fecha: Date;
}

export class DungeonPlayerStats extends DungeonRankingEntry {
  @ApiProperty({
    description:
      'The run this player is ranked on; null if they have never played',
    type: DungeonBestRun,
    nullable: true,
  })
  mejorPartida: DungeonBestRun | null;
}
