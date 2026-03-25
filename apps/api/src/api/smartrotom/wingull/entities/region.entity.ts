import { ApiProperty } from '@nestjs/swagger';

export class Point {
  @ApiProperty({ example: 0 })
  x: number;

  @ApiProperty({ example: 0 })
  z: number;
}

export class Region {
  @ApiProperty({ example: 'pueblo_kinoko' })
  name: string;

  @ApiProperty({ type: [Point] })
  points: Point[];
}
