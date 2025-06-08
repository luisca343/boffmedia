
import { UuidDto } from "@api/smartrotom/_dto/smartrotom-request-dto";
import { ApiProperty } from "@nestjs/swagger";

export class CreateChatMessageDto extends UuidDto{
    @ApiProperty({ description: 'The message to send' })
    message: string;
}