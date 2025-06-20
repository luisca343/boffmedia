import { ApiProperty } from '@nestjs/swagger';

export class ArcadeStreak {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the streak record' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 5, 
    description: 'Current streak count' 
  })
  streak: number;

  @ApiProperty({ 
    example: '2023-12-01T10:00:00Z', 
    description: 'Last claimed date' 
  })
  lastClaimed: Date;

  @ApiProperty({ 
    example: 'christmas_2023', 
    description: 'Last banner shown' 
  })
  lastBanner: string;

  @ApiProperty({ 
    example: 25, 
    description: 'Total claims made' 
  })
  totalClaims: number;
}