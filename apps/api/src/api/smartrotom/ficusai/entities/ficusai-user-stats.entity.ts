import { ApiProperty } from '@nestjs/swagger';

export class FicusAiUserStatsEntity {
  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'User UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 42,
    description: 'Total number of messages from the user',
  })
  messageCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether the user has any chat history',
  })
  hasHistory: boolean;
}
