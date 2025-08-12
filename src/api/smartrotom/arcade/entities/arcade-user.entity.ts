import { ApiProperty } from '@nestjs/swagger';

export class ArcadeUser {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the user record' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 'PlayerName123', 
    description: 'Player username' 
  })
  username: string;

  @ApiProperty({ 
    example: 'overworld', 
    description: 'Current world/server',
    required: false
  })
  world?: string;

  @ApiProperty({ 
    example: 8, 
    description: 'Current energy level',
    default: 10
  })
  energy: number;

  @ApiProperty({ 
    example: '2023-12-01T10:00:00Z', 
    description: 'Last energy charge time' 
  })
  lastCharge: Date;
}