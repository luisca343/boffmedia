import { ApiProperty } from '@nestjs/swagger';

export class Weather {
  @ApiProperty({ example: 'clear', description: 'Current weather' })
  weather: string;

  @ApiProperty({ example: 6491, description: 'Time when weather will change' })
  changeTime: number;

  @ApiProperty({ example: 21320, description: 'Current Minecraft time' })
  minecraftTime: number;
}
