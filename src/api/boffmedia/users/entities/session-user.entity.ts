import { ApiProperty } from '@nestjs/swagger';

export class SessionSmartRotomUserEntity {
  @ApiProperty({ 
    example: 'johndoe', 
    description: 'SmartRotom username' 
  })
  username: string;

  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', 
    description: 'SmartRotom UUID' 
  })
  uuid: string;

  @ApiProperty({ 
    example: 'overworld', 
    description: 'Current world' 
  })
  world: string;
}

export class SessionUserEntity {
  @ApiProperty({ 
    example: 1, 
    description: 'User ID' 
  })
  id: number;

  @ApiProperty({ 
    example: 'John Doe', 
    description: 'User display name' 
  })
  name: string;

  @ApiProperty({ 
    example: 'user@example.com', 
    description: 'User email' 
  })
  email: string;

  @ApiProperty({ 
    description: 'SmartRotom user data',
    type: SessionSmartRotomUserEntity,
    nullable: true
  })
  smartRotomUser: SessionSmartRotomUserEntity | null;
}