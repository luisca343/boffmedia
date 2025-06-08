import { ApiProperty } from "@nestjs/swagger";

export class CreateChatDto {
  @ApiProperty({ description: 'The UUID of the player' })
  player: string;

  @ApiProperty({ description: 'The list of users' })
  users: string[];

  @ApiProperty({ description: 'The name of the chat' })
  name: string;
}