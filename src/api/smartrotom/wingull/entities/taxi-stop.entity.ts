import { ApiProperty } from '@nestjs/swagger';

export class TaxiStop {
  @ApiProperty({ example: 'carretera', description: 'Taxi stop ID' })
  id: string;

  @ApiProperty({ example: 49, description: 'X coordinate' })
  x: number;

  @ApiProperty({ example: 70, description: 'Y coordinate' })
  y: number;

  @ApiProperty({ example: 13, description: 'Z coordinate' })
  z: number;

  @ApiProperty({ example: 'world', description: 'World name' })
  world: string;
}
