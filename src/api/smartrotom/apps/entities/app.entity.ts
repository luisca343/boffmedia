import { ApiProperty } from '@nestjs/swagger';

export class App {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the app' 
  })
  id: number;

  @ApiProperty({ 
    example: 'Chess Master', 
    description: 'Name of the app' 
  })
  name: string;

  @ApiProperty({ 
    example: 'https://example.com/chess-app', 
    description: 'URL or path to the app' 
  })
  url: string;

  @ApiProperty({ 
    example: 1, 
    description: 'Whether the app is active (1 = active, 0 = inactive)' 
  })
  active: number;
}