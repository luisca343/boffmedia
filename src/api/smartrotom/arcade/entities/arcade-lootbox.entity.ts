import { ApiProperty } from '@nestjs/swagger';

export class ArcadeLootbox {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the lootbox record' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'Player UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 'daily_lootbox', 
    description: 'Lootbox type' 
  })
  type: string;

  @ApiProperty({ 
    example: 3, 
    description: 'Available lootboxes count' 
  })
  available: number;

  @ApiProperty({ 
    example: '2023-12-01T10:00:00Z', 
    description: 'Last opened date' 
  })
  lastOpened: Date;

  @ApiProperty({ 
    example: '2023-11-01T10:00:00Z', 
    description: 'Record creation date' 
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2023-12-01T10:00:00Z', 
    description: 'Record last update date' 
  })
  updatedAt: Date;
}