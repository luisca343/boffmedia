import { ApiProperty } from '@nestjs/swagger';

export class GameEndResponse {
  @ApiProperty({
    description: 'Game session ID',
    example: 123,
  })
  idPartida: number;

  @ApiProperty({
    description: 'Success status',
    example: true,
    required: false,
  })
  success?: boolean;

  @ApiProperty({
    description: 'Number of rewards processed',
    example: 3,
    required: false,
  })
  rewardsProcessed?: number;
}
