import { ApiProperty } from '@nestjs/swagger';

/**
 * A league-sourced replay, served by the battlesim module (audit B14).
 *
 * The battlesim replay viewer used to fetch these straight from
 * `/smartrotom/liga/replay/:id`, so a battlesim screen depended on a SmartRotom
 * module. The row still lives in Liga's store — that is Liga's data — but the
 * HTTP surface the battle simulator reads is battlesim's own.
 *
 * Deliberately NOT `BattlesimReplayDto`: these are different records. A
 * battlesim replay has a uuid id, a `clientId` for idempotent upload and a
 * `format`; a league replay has an integer id and two rendered side strings,
 * and none of the upload fields exist for it. Reusing one DTO would mean a
 * response full of nulls whose shape lies about what a league replay is.
 */
export class BattlesimLeagueReplayDto {
  @ApiProperty({ description: 'League replay id (integer)' })
  id: number;

  @ApiProperty({ description: 'Player 1 display side' })
  side1: string;

  @ApiProperty({ description: 'Player 2 display side' })
  side2: string;

  @ApiProperty({ description: 'Player 1 team paste' })
  team1: string;

  @ApiProperty({ description: 'Player 2 team paste' })
  team2: string;

  @ApiProperty({ description: 'Showdown protocol transcript' })
  replay: string;

  @ApiProperty({ description: 'When the battle was played' })
  createdAt: Date;
}
