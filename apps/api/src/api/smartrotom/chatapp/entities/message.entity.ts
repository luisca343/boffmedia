import { ApiProperty } from '@nestjs/swagger';

export class RotomMessage {
  @ApiProperty({
    example: 123,
    description: 'Message ID',
  })
  id: number;

  @ApiProperty({
    example: 'Hello everyone!',
    description: 'Message text content',
  })
  text: string;

  @ApiProperty({
    example: '2025-06-13T23:06:15.000Z',
    description: 'Message creation date',
  })
  date: Date;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Sender UUID',
  })
  uuid: string;

  @ApiProperty({
    example: 'text',
    description: 'Message type',
  })
  type?: string;
}

export class MessageDetails {
  @ApiProperty({
    example: 123,
    description: 'Message ID',
  })
  id: number;

  @ApiProperty({
    example: 'Hello everyone!',
    description: 'Message content',
  })
  content: string;

  @ApiProperty({
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Sender UUID',
  })
  senderUUID: string;

  @ApiProperty({
    example: 'text',
    description: 'Message type',
  })
  type: string;

  @ApiProperty({
    example: '2025-06-13T23:06:15.000Z',
    description: 'Message creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: 1,
    description: 'Chat ID',
  })
  chatId: number;
}

export class CreateMessageResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Message created successfully',
    description: 'Response message',
  })
  message: string;

  @ApiProperty({
    description: 'Created message details',
    type: RotomMessage,
  })
  data: RotomMessage;
}

export class MessageResponse {
  @ApiProperty({
    example: true,
    description: 'Whether the operation was successful',
  })
  success: boolean;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
  })
  message: string;
}

export class MarkChatReadResponse extends MessageResponse {
  @ApiProperty({
    example: 12,
    description: 'How many messages flipped from unread to read',
  })
  marked: number;
}
