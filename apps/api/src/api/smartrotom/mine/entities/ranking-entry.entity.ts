import { ApiProperty } from '@nestjs/swagger';

export class RankingEntry {
  @ApiProperty({
    description: 'Player UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  uuid: string;

  @ApiProperty({
    description: 'Player username',
    example: 'Luisca343',
  })
  username: string;

  @ApiProperty({
    description: 'Total value earned',
    example: 25100,
  })
  totalValue: number;

  @ApiProperty({
    description: 'Number of games played',
    example: 4,
  })
  gamesPlayed: number;

  @ApiProperty({
    description: 'Player rank position',
    example: 1,
  })
  rank: number;
}
