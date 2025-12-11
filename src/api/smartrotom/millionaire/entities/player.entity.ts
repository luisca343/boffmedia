import { ApiProperty } from '@nestjs/swagger';

export class PlayerEntity {
  @ApiProperty({ example: 1, description: 'Player ID' })
  id: number;

  @ApiProperty({ example: 1, description: 'Session ID' })
  sessionId: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', description: 'Player UUID' })
  uuid: string;

  @ApiProperty({ example: 'John Doe', description: 'Player name' })
  name: string;

  @ApiProperty({ example: 'CONNECTED', description: 'Connection status' })
  connectionStatus: string;

  @ApiProperty({ example: '2025-06-28T10:00:00Z', description: 'Last heartbeat time' })
  lastHeartbeat: Date;

  @ApiProperty({ example: '2025-06-28T10:00:00Z', description: 'Player join time' })
  createdAt: Date;
}
