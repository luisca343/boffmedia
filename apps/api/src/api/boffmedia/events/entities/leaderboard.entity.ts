import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardEntry {
  @ApiProperty({
    example: 1,
    description: 'Participant ID',
  })
  participantId: number;

  @ApiProperty({
    example: 'JohnTheGamer',
    description: 'Participant nickname',
  })
  nickname: string;

  @ApiProperty({
    example: '/avatars/john.png',
    description: 'Participant avatar',
  })
  avatar: string;

  @ApiProperty({
    example: 1,
    description: 'User ID',
  })
  userId: number;

  @ApiProperty({
    example: 250,
    description: 'Total achievement points',
  })
  achievementPoints: number;

  @ApiProperty({
    example: 100,
    description: 'Total medal points',
  })
  medalPoints: number;

  @ApiProperty({
    example: 350,
    description: 'Total points (achievements + medals)',
  })
  totalPoints: number;

  @ApiProperty({
    example: 5,
    description: 'Number of achievements completed',
  })
  achievementCount: number;

  @ApiProperty({
    example: 2,
    description: 'Number of medals earned',
  })
  medalCount: number;

  @ApiProperty({
    example: 1,
    description: 'Current rank position',
  })
  rank?: number;
}

export class TeamLeaderboardEntry {
  @ApiProperty({
    example: 1,
    description: 'Team ID',
  })
  teamId: number;

  @ApiProperty({
    example: 'Team Alpha',
    description: 'Team name',
  })
  teamName: string;

  @ApiProperty({
    example: 'ALPH',
    description: 'Team tag',
    required: false,
  })
  teamTag?: string;

  @ApiProperty({
    example: '/icons/team-alpha.png',
    description: 'Team icon',
    required: false,
  })
  teamIcon?: string;

  @ApiProperty({
    example: 750,
    description: 'Total team points',
  })
  totalPoints: number;

  @ApiProperty({
    example: 750,
    description: 'Team score (alias for totalPoints)',
  })
  score: number;

  @ApiProperty({
    example: 3,
    description: 'Number of team members',
  })
  memberCount: number;

  @ApiProperty({
    example: 1,
    description: 'Current rank position',
  })
  rank?: number;
}
