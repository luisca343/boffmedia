import { ApiProperty } from '@nestjs/swagger';

export class GameSession {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the game session' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: '2025-06-28T10:00:00Z', 
    description: 'When the game was created' 
  })
  createdAt: Date;
}