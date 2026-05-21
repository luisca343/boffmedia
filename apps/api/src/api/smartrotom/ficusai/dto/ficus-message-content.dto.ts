import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessagePartDto } from './message-part.dto';
import { MessageSender } from '../enums/message-sender.enum';

export class FicusMessageContentDto {
  @ApiProperty({
    description: 'Sender of the message',
    example: MessageSender.USER,
    enum: MessageSender,
    enumName: 'MessageSender',
  })
  @IsString()
  @IsEnum(MessageSender)
  @IsNotEmpty()
  sender: MessageSender;

  @ApiProperty({
    description: 'Parts of the message',
    type: MessagePartDto,
    isArray: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessagePartDto)
  parts: MessagePartDto[];
}
