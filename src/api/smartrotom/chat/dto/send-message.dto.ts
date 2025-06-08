import { IsString, IsUUID } from 'class-validator';
import { FicusMessage } from '../chat.service';

export class SendMessageDto {
  @IsUUID()
  uuid: string;

  @IsString()
  mensaje: FicusMessage;
}