import { ApiProperty } from '@nestjs/swagger';

export class GobiernoCountersEntity {
  @ApiProperty({
    example: 4,
    description: "denuncias not in ('resolved','dismissed')",
  })
  denuncias: number;

  @ApiProperty({ example: 2, description: "buscados with status = 'active'" })
  buscados: number;

  @ApiProperty({ example: 7, description: "multas with status = 'pending'" })
  multas: number;

  @ApiProperty({
    example: 1,
    description: "apelaciones with status in ('pending','reviewing')",
  })
  apelaciones: number;
}
