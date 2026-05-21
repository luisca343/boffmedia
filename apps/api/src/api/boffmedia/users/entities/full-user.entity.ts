import { ApiProperty } from '@nestjs/swagger';
import { BoffMediaUserEntity } from './user.entity';

export class SmartRotomUserEntity {
  @ApiProperty({
    example: 1,
    description: 'SmartRotom user ID',
  })
  id: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'SmartRotom user UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'SmartRotom username',
  })
  username: string;

  @ApiProperty({
    example: 'overworld',
    description: 'Current Minecraft world',
    nullable: true,
  })
  world: string | null;

  @ApiProperty({
    example: 10,
    description: 'User energy level',
    nullable: true,
  })
  energy: number | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last energy charge timestamp',
    nullable: true,
  })
  lastCharge: Date | null;
}

export class FullUserEntity {
  @ApiProperty({
    description: 'BoffMedia user data',
    type: BoffMediaUserEntity,
  })
  boffmedia_users: BoffMediaUserEntity;

  @ApiProperty({
    description: 'SmartRotom user data',
    type: SmartRotomUserEntity,
    nullable: true,
  })
  rotom_users: SmartRotomUserEntity | null;
}
