import { ApiProperty } from '@nestjs/swagger';
import { MessageSender } from '../enums/message-sender.enum';
import { MessagePartType } from './message-part.dto';

export class MessageSenderSchema {
  @ApiProperty({
    enum: MessageSender,
    enumName: 'MessageSender',
    description: 'Available message senders',
    example: MessageSender.USER,
  })
  sender: MessageSender;
}

export class MessagePartTypeSchema {
  @ApiProperty({
    enum: MessagePartType,
    enumName: 'MessagePartType',
    description: 'Available message part types',
    example: MessagePartType.TEXT,
  })
  type: MessagePartType;
}

export class EnumsResponseDto {
  @ApiProperty({
    enum: MessageSender,
    enumName: 'MessageSender',
    description: 'MessageSender enum values',
  })
  MessageSender: typeof MessageSender;

  @ApiProperty({
    enum: MessagePartType,
    enumName: 'MessagePartType',
    description: 'MessagePartType enum values',
  })
  MessagePartType: typeof MessagePartType;
}
