import { ApiProperty } from '@nestjs/swagger';

export class CallUser {
  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'User UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'RINGING',
    description: 'User call status',
    enum: ['RINGING', 'IN_CALL', 'DECLINED', 'BUSY'],
  })
  status: 'RINGING' | 'IN_CALL' | 'DECLINED' | 'BUSY';
}

export class CallSession {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Unique call identifier',
  })
  callId: string;

  @ApiProperty({
    example: 1,
    description: 'Chat ID',
  })
  chatId: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Caller UUID',
  })
  caller: string;

  @ApiProperty({
    description: 'Users participating in the call',
    type: [CallUser],
  })
  users: CallUser[];

  @ApiProperty({
    example: 1640995200000,
    description: 'Call start timestamp',
    required: false,
  })
  startTime?: number;
}

export class CallResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Call initiated successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'Call session details',
    type: CallSession,
    required: false,
  })
  callSession?: CallSession;
}
