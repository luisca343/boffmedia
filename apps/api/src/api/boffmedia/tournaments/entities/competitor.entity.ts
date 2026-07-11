import { ApiProperty } from '@nestjs/swagger';
import type { CompetitorKind } from '../tournaments.types';

export class RosterMember {
  @ApiProperty()
  id: number;

  @ApiProperty({ nullable: true })
  userId: number | null;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  role: string | null;
}

/** Maps the web `TnCompetitor` VM (identity only; records live on Standing/LbEntry). */
export class Competitor {
  @ApiProperty({ description: 'Stringified participant id.' })
  id: string;

  @ApiProperty({ enum: ['solo', 'team', 'entry'] })
  kind: CompetitorKind;

  @ApiProperty()
  name: string;

  @ApiProperty({ nullable: true })
  tag: string | null;

  @ApiProperty({ nullable: true, description: 'ISO alpha-2 country code.' })
  country: string | null;

  @ApiProperty({ nullable: true, description: 'Emoji flag derived from country.' })
  flag: string | null;

  @ApiProperty({ nullable: true })
  seed: number | null;

  @ApiProperty({ nullable: true })
  hue: number | null;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty({ type: [RosterMember], required: false })
  roster?: RosterMember[];
}
