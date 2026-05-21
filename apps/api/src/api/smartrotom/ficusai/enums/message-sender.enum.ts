import { ApiProperty } from '@nestjs/swagger';

export enum MessageSender {
  USER = 'user',
  BOT = 'bot',
}

export class MessageSenderEnum {
  @ApiProperty({ enum: MessageSender, enumName: 'MessageSender' })
  value: MessageSender;
}
