import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GobiernoCensoEntity {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  uuid: string;

  @ApiProperty({ example: 'TrainerAsh' })
  username: string;

  @ApiProperty({
    enum: ['bueno', 'observado', 'sancionado'],
    description:
      'sancionado = active buscado · observado = pending multa · bueno = neither',
  })
  standing: 'bueno' | 'observado' | 'sancionado';

  @ApiProperty({
    example: 2,
    description: 'Number of parcelas owned (from WorldGuard)',
  })
  parcelas: number;

  @ApiProperty({
    type: [String],
    example: ['pueblo_mizu'],
    description: 'Distinct towns where this player owns a parcela',
  })
  towns: string[];

  @ApiProperty({ example: 0, description: 'Count of pending multas' })
  multasPendientes: number;

  @ApiProperty({ example: false, description: 'Has an active buscado notice' })
  buscado: boolean;
}

export class GobiernoCensoListEntity {
  @ApiProperty({ type: [GobiernoCensoEntity] })
  items: GobiernoCensoEntity[];

  @ApiProperty({ example: 340 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoOficialRankEntity {
  @ApiProperty({ example: 'GOB_ALCALDE' })
  role: string;

  @ApiProperty({ example: 'Alcalde' })
  label: string;

  @ApiProperty({ example: 'A' })
  prefix: string;
}

export class GobiernoOficialEntity {
  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  uuid: string;

  @ApiProperty({ example: 7, description: 'Backs the derived badge number' })
  userId: number;

  @ApiProperty({ example: 'TrainerAsh' })
  username: string;

  @ApiPropertyOptional({ nullable: true })
  profilePicture?: string | null;

  @ApiProperty({ type: [String], example: ['GOBIERNO', 'GOB_AGENTE'] })
  roles: string[];

  @ApiPropertyOptional({
    type: GobiernoOficialRankEntity,
    nullable: true,
    description:
      'Highest GOB_* rank held — null if the officer only holds the base GOBIERNO role',
  })
  rank?: GobiernoOficialRankEntity | null;
}
