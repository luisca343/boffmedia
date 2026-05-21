import { ApiProperty } from '@nestjs/swagger';

export class FicusMessage {
  @ApiProperty({
    example: 1,
    description: 'Unique identifier for the message',
  })
  id: number;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'UUID of the player/user',
  })
  uuid: string;

  @ApiProperty({
    example: { sender: 'user', parts: [{ type: 'text', content: 'Hello!' }] },
    description: 'Message content as JSON',
  })
  content: any;

  @ApiProperty({
    example: '2024-08-02T10:30:00Z',
    description: 'When the message was created',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-08-02T10:30:00Z',
    description: 'When the message was last updated',
  })
  updatedAt: Date;

  @ApiProperty({
    example: null,
    description: 'When the message was deleted (soft delete)',
  })
  deletedAt?: Date;
}
