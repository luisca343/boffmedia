import { ApiProperty } from '@nestjs/swagger';

export interface TaxiStop {
  id: string;
  x: number;
  y: number;
  z: number;
  world: string;
}