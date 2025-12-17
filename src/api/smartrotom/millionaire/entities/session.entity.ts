import { ApiProperty } from '@nestjs/swagger';

export class SessionEntity {
  @ApiProperty({ example: 1, description: 'Session ID' })
  id: number;

  @ApiProperty({ example: 'ABCD1234', description: 'Session code' })
  sessionCode: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', description: 'Conductor UUID' })
  conductorUuid: string;

  @ApiProperty({ example: 'WAITING', description: 'Session status' })
  status: string;

  @ApiProperty({ example: 0, description: 'Current question number (0-14)' })
  currentQuestion: number;

  @ApiProperty({ 
    example: { '50:50': true, 'phone': true, 'audience': true },
    description: 'Remaining lifelines' 
  })
  lifelinesRemaining: Record<string, boolean>;

  @ApiProperty({ example: '2025-06-28T10:00:00Z', description: 'Session creation time' })
  createdAt: Date;

  @ApiProperty({ example: '2025-06-28T10:00:00Z', description: 'Last update time' })
  updatedAt: Date;
}
