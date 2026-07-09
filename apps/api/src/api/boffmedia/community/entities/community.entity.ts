import { ApiProperty } from '@nestjs/swagger';

export class SiteStatsEntity {
  @ApiProperty({ example: 1240, description: 'Registered users' })
  users: number;

  @ApiProperty({ example: 38, description: 'Non-deleted events' })
  events: number;

  @ApiProperty({ example: 3, description: 'Events currently active' })
  activeEvents: number;

  @ApiProperty({ example: 5120, description: 'Distinct participants' })
  participants: number;

  @ApiProperty({ example: 210, description: 'Non-deleted achievements/medals' })
  achievements: number;
}

export class ActivityItemEntity {
  @ApiProperty({ enum: ['achievement', 'event_join'] })
  type: 'achievement' | 'event_join';

  @ApiProperty({ example: 'Ash', description: 'Actor nickname' })
  actor: string;

  @ApiProperty({ example: 'Campeón regional', description: 'Achievement or event name' })
  name: string;

  @ApiProperty({ example: '/icons/trophy.png' })
  icon: string;

  @ApiProperty({ type: String, format: 'date-time' })
  at: string;
}
