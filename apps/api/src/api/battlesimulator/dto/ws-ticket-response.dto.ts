import { ApiProperty } from '@nestjs/swagger';

export class BattlesimTicketDto {
  @ApiProperty({
    description: 'Short-lived JWT ticket for WebSocket authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  ticket: string;

  @ApiProperty({
    description: 'Ticket expiration time in seconds',
    example: 60,
  })
  expiresIn: number;
}
