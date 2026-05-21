import { BaseDto } from '@api/_utils/dto/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  CALL = 'call',
  SYSTEM = 'system',
  IMAGE = 'image',
  STICKER = 'sticker',
  EMOJI = 'emoji',
  VIDEO = 'video',
  DOCUMENT = 'document',
  WAYPOINT = 'waypoint',
  // From the Pixelmon Chat
  CHAT = 'chat',
}

export class CreateMessageDto extends BaseDto {
  @ApiProperty({
    description: 'Sender UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello everyone!',
  })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({
    description: 'Type of message',
    enum: MessageType,
    example: MessageType.TEXT,
    required: false,
  })
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;
}

export class GetMessagesDto {
  @ApiProperty({
    description: 'Chat ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  chatId: number;

  @ApiProperty({
    description: 'Maximum number of messages to retrieve',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsInt()
  limit?: number;
}

export class UpdateMessageDto extends BaseDto {
  @ApiProperty({
    description: 'Message ID',
    example: 123,
  })
  @IsNotEmpty()
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: 'New message content',
    example: 'Updated message content',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @ApiProperty({
    description: 'UUID of user updating the message',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class DeleteMessageDto extends BaseDto {
  @ApiProperty({
    description: 'Message ID',
    example: 123,
  })
  @IsNotEmpty()
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: 'UUID of user deleting the message',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}

export class MarkMessageReadDto extends BaseDto {
  @ApiProperty({
    description: 'Message ID',
    example: 123,
  })
  @IsNotEmpty()
  @IsInt()
  messageId: number;

  @ApiProperty({
    description: 'User UUID',
    example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4',
  })
  @IsNotEmpty()
  @IsString()
  uuid: string;
}
