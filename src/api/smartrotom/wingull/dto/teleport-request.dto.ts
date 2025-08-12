import { ApiProperty } from '@nestjs/swagger';

export class TeleportRequestDto {
  @ApiProperty({ example: 'taxi_stop_1', description: 'Taxi stop ID' })
  id: string;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4', description: 'Player UUID' })
  uuid: string;
}
