import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonRefEntity } from '../../_shared/entities/person-ref.entity';

export class GobiernoMultaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'MUL-4F2A9C' })
  code: string;

  @ApiProperty({ type: PersonRefEntity })
  player: PersonRefEntity;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: 'pending' })
  status: string;

  @ApiProperty()
  reason: string;

  @ApiProperty({ type: PersonRefEntity })
  issuedBy: PersonRefEntity;

  @ApiPropertyOptional({ type: Number, nullable: true })
  denunciaId?: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  paidTxId?: number | null;

  @ApiPropertyOptional({ nullable: true })
  paidAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GobiernoMultaListEntity {
  @ApiProperty({ type: [GobiernoMultaEntity] })
  items: GobiernoMultaEntity[];

  @ApiProperty({ example: 20 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}

export class GobiernoTasaEntity {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'TAS-4F2A9C' })
  code: string;

  @ApiProperty({ example: 'Impuesto de parcela' })
  concept: string;

  @ApiProperty({ example: 'parcela' })
  kind: string;

  @ApiProperty({ example: '500₽/parcela' })
  rate: string;

  @ApiProperty({ example: 500 })
  amount: number;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({
    example: 14500,
    description:
      'DERIVED, never stored: the sum of TASA transactions into the treasury whose reason carries this code. The rate card says what is charged; the ledger says what was actually collected.',
  })
  collected: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TesoreriaSeriePuntoEntity {
  @ApiProperty({ example: '2026-07-13' })
  label: string;

  @ApiProperty({ example: 2500 })
  ingreso: number;

  @ApiProperty({ example: 800 })
  gasto: number;
}

export class TesoreriaBreakdownItemEntity {
  @ApiProperty({
    example: 'Multas cobradas',
    description: 'Human label for the transaction type',
  })
  concept: string;

  @ApiProperty({ example: 4200 })
  amount: number;

  @ApiProperty({ example: 8 })
  count: number;

  @ApiProperty({
    example: 'hacienda',
    description:
      'Which department the money moved through — drives the spine colour',
  })
  dep: string;
}

export class GobiernoTesoreriaEntity {
  @ApiProperty({
    example: 128500,
    description: 'Current GOVERNMENT account balance',
  })
  balance: number;

  @ApiProperty({
    example: 30,
    description: 'Window size in days used for the series/totals below',
  })
  days: number;

  @ApiProperty({ example: 8300, description: 'Income over the window' })
  ingresosMes: number;

  @ApiProperty({ example: 1200, description: 'Expense over the window' })
  gastosMes: number;

  @ApiProperty({ type: [TesoreriaSeriePuntoEntity] })
  series: TesoreriaSeriePuntoEntity[];

  @ApiProperty({ type: [TesoreriaBreakdownItemEntity] })
  ingresos: TesoreriaBreakdownItemEntity[];

  @ApiProperty({ type: [TesoreriaBreakdownItemEntity] })
  gastos: TesoreriaBreakdownItemEntity[];

  @ApiProperty({
    type: [GobiernoTasaEntity],
    description:
      'The rate card, each row carrying what the ledger says it actually collected.',
  })
  tasas: GobiernoTasaEntity[];
}
