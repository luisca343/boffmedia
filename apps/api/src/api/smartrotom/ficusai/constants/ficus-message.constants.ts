import { MessageSender } from '../enums/message-sender.enum';
import { MessagePartType } from '../dto/message-part.dto';

export const FICUS_MESSAGE_CONSTANTS = {
  SENDER: MessageSender,
  PART_TYPE: MessagePartType,
} as const;

export type FicusMessageConstants = typeof FICUS_MESSAGE_CONSTANTS;
