import { uuidDto } from "./uuid-dto";

export type CreateChatMessageDto  = Partial<uuidDto> &{
    message: string;
}