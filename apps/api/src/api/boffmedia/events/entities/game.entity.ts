import { ApiProperty } from '@nestjs/swagger';

export class Game {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the game',
  })
  id: number;

  @ApiProperty({
    example: 'Minecraft',
    description: 'Title of the game',
  })
  title: string;

  @ApiProperty({
    example: 'A sandbox video game developed by Mojang Studios',
    description: 'Description of the game',
  })
  description: string;

  @ApiProperty({
    example: '/icons/minecraft.png',
    description: 'Game icon URL',
  })
  icon: string;

  @ApiProperty({
    example: 1,
    description: 'Whether the game is active (1 = active, 0 = inactive)',
    required: false,
  })
  active?: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the game was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'When the game was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'When the game was deleted',
    required: false,
  })
  deletedAt?: Date;
}
