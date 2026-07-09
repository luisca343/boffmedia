import { ApiProperty } from '@nestjs/swagger';

export class PlayerRankInfo {
  @ApiProperty({
    description: 'Player rank position',
    example: 5,
  })
  rank: number;

  @ApiProperty({
    description: 'Total value earned',
    example: 5000,
  })
  totalValue: number;
}

export class PlayerStatistics {
  @ApiProperty({
    description: 'Total number of games played',
    example: 25,
  })
  totalGames: number;

  @ApiProperty({
    description: 'Total value earned across all games',
    example: 5000,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Average value per game',
    example: 200,
  })
  averageValue: number;

  @ApiProperty({
    description: 'Date of last game played',
    example: '2025-06-28T10:00:00Z',
    type: Date,
    nullable: true,
  })
  lastPlayed: Date | null;

  @ApiProperty({
    description: 'Player ranking information',
    type: PlayerRankInfo,
    nullable: true,
  })
  ranking: PlayerRankInfo | null;
}
