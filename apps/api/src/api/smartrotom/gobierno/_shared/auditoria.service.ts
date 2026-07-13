import { Injectable } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import {
  AuditoriaRepository,
  CreateAuditoriaData,
} from './auditoria.repository';
import { ListAuditoriaQueryDto } from './dto/list-auditoria-query.dto';
import { GobiernoAuditoriaListEntity } from './entities/auditoria.entity';
import { PeopleRepository } from './people.repository';
import { toPersonRef } from './entities/person-ref.entity';

// Append-only ledger of every mutating action across the gobierno module. Serves both the
// «Auditoría» screen (Gobierno dept) and the «Actividad» log (Administración) — same table,
// filtered differently by the frontend. Nothing here is ever updated or deleted.
@Injectable()
export class AuditoriaService {
  constructor(
    private readonly logger: Logger,
    private readonly auditoriaRepository: AuditoriaRepository,
    private readonly peopleRepository: PeopleRepository,
  ) {}

  async log(data: CreateAuditoriaData): Promise<void> {
    try {
      await this.auditoriaRepository.log(data);
    } catch (error: any) {
      // Auditing must never block the mutation it is describing.
      this.logger.error('Failed to write auditoria row:', error);
    }
  }

  async list(
    query: ListAuditoriaQueryDto,
  ): Promise<GobiernoAuditoriaListEntity> {
    const { items, total, page, pageSize } =
      await this.auditoriaRepository.list(query);

    const names = await this.peopleRepository.findUsernames(
      items.map((row) => row.actorUuid),
    );

    return {
      items: items.map((row) => ({
        ...row,
        actor: toPersonRef(row.actorUuid, names),
      })),
      total,
      page,
      pageSize,
    };
  }
}
