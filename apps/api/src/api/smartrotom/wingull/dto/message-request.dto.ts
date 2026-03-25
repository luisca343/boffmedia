import { ApiProperty } from '@nestjs/swagger';

export class MessageRequestDto {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', description: 'Player UUID' })
  uuid: string;

  @ApiProperty({ example: 'Hello, trainer!', description: 'Message to send' })
  message: string;
}
