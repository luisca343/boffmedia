import { ApiProperty } from '@nestjs/swagger';
import { Competitor } from './competitor.entity';
import { MatchView } from './match.entity';

/** Maps the web `TnStanding` VM. */
export class Standing {
  @ApiProperty()
  rank: number;

  @ApiProperty({ type: Competitor })
  c: Competitor;

  @ApiProperty()
  played: number;

  @ApiProperty()
  w: number;

  @ApiProperty()
  d: number;

  @ApiProperty()
  l: number;

  @ApiProperty({ description: 'Games/points for.' })
  gf: number;

  @ApiProperty({ description: 'Games/points against.' })
  ga: number;

  @ApiProperty()
  pts: number;
}

class CrosstableCell {
  @ApiProperty({ description: 'Result letter: W/L/D.' })
  r: string;

  @ApiProperty({ description: 'Score, e.g. "2-1".' })
  s: string;
}

/** Maps the web `TnCrosstableData` VM. */
export class CrosstableData {
  @ApiProperty({ type: [Competitor] })
  entrants: Competitor[];

  @ApiProperty({
    type: 'array',
    description: 'entrants × entrants matrix; null on the diagonal / unplayed.',
    items: { type: 'array', items: { type: 'object', nullable: true } },
  })
  grid: (CrosstableCell | null)[][];
}

/** Maps the web `TnGroup` VM. */
export class GroupView {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  done: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  advance: number;

  @ApiProperty({ type: [Standing] })
  standings: Standing[];
}

/** Maps the web `TnLeague` VM (round-robin). */
export class LeagueView {
  @ApiProperty({ type: [Standing] })
  table: Standing[];

  @ApiProperty({ type: CrosstableData })
  crosstable: CrosstableData;

  @ApiProperty()
  done: number;

  @ApiProperty()
  total: number;
}

/** Single-elim / groups-knockout bracket view. */
export class BracketView {
  @ApiProperty({
    type: 'array',
    description: 'Rounds, each an array of MatchView (maps DkBracket rounds).',
    items: { type: 'array', items: { $ref: '#/components/schemas/MatchView' } },
  })
  rounds: MatchView[][];
}

/** Double-elimination view. */
export class DoubleBracketView {
  @ApiProperty({ type: 'array', items: { type: 'array' } })
  winners: MatchView[][];

  @ApiProperty({ type: 'array', items: { type: 'array' } })
  losers: MatchView[][];

  @ApiProperty({ type: MatchView, nullable: true })
  grandFinal: MatchView | null;
}
