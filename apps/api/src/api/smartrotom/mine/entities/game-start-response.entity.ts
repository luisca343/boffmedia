import { ApiProperty } from '@nestjs/swagger';

export class GameStartResponse {
  @ApiProperty({
    description: 'Game session ID',
    example: 123,
  })
  idPartida: number;
}
