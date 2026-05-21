import { ApiProperty } from '@nestjs/swagger';

export class Performance {
  @ApiProperty({ example: '20', description: 'Ticks per second (TPS)' })
  tps: string;

  @ApiProperty({ example: 0, description: 'Number of players online' })
  players: number;

  @ApiProperty({ example: 15.41, description: 'Memory usage in GB' })
  memory: number;

  @ApiProperty({ example: '24d 23h 47m', description: 'Server uptime' })
  uptime: string;
}
