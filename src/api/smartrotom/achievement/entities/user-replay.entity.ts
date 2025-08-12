import { ApiProperty } from '@nestjs/swagger';

export class UserReplayEntity {
  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 123, 
    description: 'Replay ID' 
  })
  replayId: number;

  @ApiProperty({ 
    example: 1, 
    description: 'Player side (1 or 2)' 
  })
  side: number;
}