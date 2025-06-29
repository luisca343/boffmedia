import { ApiProperty } from '@nestjs/swagger';

export class SmartRotomUser {
  @ApiProperty({ 
    example: 1, 
    description: 'Unique identifier for the user' 
  })
  id: number;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'UUID of the user' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 'PlayerName123', 
    description: 'Username of the user' 
  })
  username: string;

  @ApiProperty({ 
    example: 'survival', 
    description: 'World of the user',
    required: false
  })
  world?: string;
}