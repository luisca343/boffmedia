import { IsObject, IsString, IsUUID } from 'class-validator';
import { FicusMessage } from '../chat.service';
import { BaseDto } from '@api/_utils/dto/base.dto';
import { is } from 'drizzle-orm';

export class SendMessageDto extends BaseDto{
  @IsUUID()
  uuid: string;

  @IsObject()
  mensaje: FicusMessage;
  
  @IsString()
  server: string;
}