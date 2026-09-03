import { ApiProperty } from '@nestjs/swagger';

export class BattlesimReplayDto {
  @ApiProperty({ description: 'Unique replay id' })
  id: string;

  @ApiProperty({ description: 'Client-generated id for idempotency' })
  clientId: string;

  @ApiProperty({ description: 'Battle format' })
  format: string;

  @ApiProperty({ description: 'Player 1 name' })
  p1Name: string;

  @ApiProperty({ description: 'Player 2 name' })
  p2Name: string;

  @ApiProperty({ description: 'Winner name or null for draw', nullable: true })
  winner: string | null;

  @ApiProperty({ description: 'Team snapshots as JSON', nullable: true })
  teams: string | null;

  @ApiProperty({ description: 'Battle source' })
  source: string;

  @ApiProperty({
    description: 'Opponent user id (for PvP battles)',
    nullable: true,
  })
  opponentUserId: number | null;

  @ApiProperty({ description: 'When the battle was played (epoch ms)' })
  playedAt: number;

  @ApiProperty({ description: 'Server creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Server update timestamp' })
  updatedAt: Date;
}
