import { ApiProperty } from '@nestjs/swagger';

export class SmartRotomApp {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the app' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Mina', 
    description: 'Name of the app' 
  })
  name: string;

  @ApiProperty({ 
    example: 'mina', 
    description: 'URL or path to the app' 
  })
  url: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Whether the app is active (1 = active, 0 = inactive)' 
  })
  active: number;
}