import { ApiProperty } from '@nestjs/swagger';

export class RotomUser {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the user',
  })
  id: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'UUID of the user',
  })
  uuid: string;

  @ApiProperty({
    example: 'Luisca343',
    description: 'Username of the user',
  })
  username: string;

  @ApiProperty({
    example: '1ee7e5f6-8e50-4b49-9ee6-b26cc1b5f365',
    description: 'World of the user',
    required: false,
  })
  world?: string;

  @ApiProperty({
    example: 10,
    description: 'Current energy of the user',
  })
  energy: number;

  @ApiProperty({
    example: '2025-06-29T11:03:01.000Z',
    description: 'Last time the user charged energy',
  })
  lastCharge: Date;
}
