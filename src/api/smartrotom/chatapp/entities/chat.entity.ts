import { ApiProperty } from '@nestjs/swagger';

export class ChatMember {
  @ApiProperty({ 
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
    description: 'Member UUID'
  })
  uuid: string;
}

export class ChatMessage {
  @ApiProperty({ 
    example: 123,
    description: 'Message ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'Hello everyone!',
    description: 'Message content'
  })
  content: string;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Message creation date'
  })
  createdAt: Date;
}

export class Chat {
  @ApiProperty({ 
    example: 1,
    description: 'Chat ID'
  })
  id: number;

  @ApiProperty({ 
    example: 'My Group Chat',
    description: 'Chat name'
  })
  name: string;

  @ApiProperty({ 
    example: 3,
    description: 'Chat type (0=public, 1=private, 2=direct, 3=group)'
  })
  type: number;

  @ApiProperty({ 
    example: 'A chat for discussing strategies',
    description: 'Chat description'
  })
  description: string;

  @ApiProperty({ 
    example: '/smartrotom/img/apps/chatapp/group_chat.png',
    description: 'Chat image URL'
  })
  image: string;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Chat creation date'
  })
  createdAt: Date;

  @ApiProperty({ 
    example: '2025-06-14T12:00:00.000Z',
    description: 'Chat last update date'
  })
  updatedAt: Date;

  @ApiProperty({ 
    description: 'Recent messages in the chat',
    type: [ChatMessage]
  })
  messages: ChatMessage[];

  @ApiProperty({ 
    example: 3,
    description: 'Number of unread messages'
  })
  unread: number;

  @ApiProperty({ 
    description: 'Chat members',
    type: [ChatMember]
  })
  members: ChatMember[];
}

export class CreateChatResponse {
  @ApiProperty({ 
    example: true,
    description: 'Whether the operation was successful'
  })
  success: boolean;

  @ApiProperty({ 
    example: 'Chat created successfully',
    description: 'Response message'
  })
  message: string;

  @ApiProperty({ 
    example: 123,
    description: 'Created chat ID'
  })
  chatId: number;
}