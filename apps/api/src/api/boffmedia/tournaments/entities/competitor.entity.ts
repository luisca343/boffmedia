import { ApiProperty } from '@nestjs/swagger';
import type { CompetitorKind, ParticipantStatus } from '../tournaments.types';
import { TeamsheetMonDto } from '../dto/teamsheet.dto';

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

  @ApiProperty({
    nullable: true,
    description: 'Emoji flag derived from country.',
  })
  flag: string | null;

  @ApiProperty({ nullable: true })
  seed: number | null;

  @ApiProperty({ enum: ['active', 'eliminated', 'withdrew', 'disqualified'] })
  status: ParticipantStatus;

  @ApiProperty({ description: 'Checked in for the current check-in window.' })
  checkedIn: boolean;

  @ApiProperty({ nullable: true })
  hue: number | null;

  @ApiProperty({ nullable: true })
  avatar: string | null;

  @ApiProperty({ nullable: true, description: 'Leaderboard-format score.' })
  score: number | null;

  @ApiProperty({
    description: 'Leaderboard-format: entry verified by an admin.',
  })
  verified: boolean;

  @ApiProperty({ type: [RosterMember], required: false })
  roster?: RosterMember[];

  @ApiProperty({
    type: [TeamsheetMonDto],
    nullable: true,
    description:
      "This entrant's open teamsheet, or null when the caller may not read it. Sent to admins always, and to the audience named by the tournament's `teamsheetVisibility` — but never before the tournament is live, so no one builds a team against a roster they have already read. Populated only on the tournament detail; the participants list never carries sheets.",
  })
  teamsheet: TeamsheetMonDto[] | null;

  @ApiProperty({
    type: [String],
    nullable: true,
    enum: ['teamsheet', 'check-in'],
    description:
      "What this registration is still missing before it counts as an entry — who is about to be dropped, and why. Admin-only: null for everyone else. A player reads their own through `viewerEntryGaps`.",
  })
  entryGaps: string[] | null;
}
