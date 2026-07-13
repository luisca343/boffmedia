import { ApiProperty } from '@nestjs/swagger';
import { PersonRefEntity } from './person-ref.entity';

export class GobiernoAuditoriaEntity {
  @ApiProperty({ example: 512 })
  id: number;

  @ApiProperty({ example: '67d9b543-5ac9-41e1-a8a5-20d7689e24a4' })
  actorUuid: string;

  @ApiProperty({
    type: PersonRefEntity,
    nullable: true,
    description:
      'The actor, resolved to a name. Every uuid on a gobierno row is enriched like this — the UI renders names and avatars and must never N+1 to look them up.',
  })
  actor: PersonRefEntity | null;

  @ApiProperty({
    example: 'resolve',
    description:
      'Short verb: create, update, delete, pay, cancel, resolve, capture, close, send, grant, revoke…',
  })
  action: string;

  @ApiProperty({ example: 'multa GOB-0042' })
  target: string;

  @ApiProperty({
    example: 'hacienda',
    description:
      'urbanismo | seguridad | hacienda | justicia | poblacion | gobierno | eventos | administracion',
  })
  dep: string;

  @ApiProperty({
    example: 'gobierno',
    description:
      'Which screen logged this row: gobierno (Auditoría) or actividad (Actividad).',
  })
  source: string;

  @ApiProperty({ example: '2026-07-13T10:00:00.000Z' })
  createdAt: Date;
}

export class GobiernoAuditoriaListEntity {
  @ApiProperty({ type: [GobiernoAuditoriaEntity] })
  items: GobiernoAuditoriaEntity[];

  @ApiProperty({ example: 128 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  pageSize: number;
}
