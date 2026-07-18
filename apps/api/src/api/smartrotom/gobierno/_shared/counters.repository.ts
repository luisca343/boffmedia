import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { eq, inArray, notInArray, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  gobiernoDenuncias,
  gobiernoBuscados,
  gobiernoMultas,
  gobiernoApelaciones,
} from '@/_db/schema/SmartRotomGobierno';
import { GobiernoCountersEntity } from './entities/counters.entity';

@Injectable()
export class CountersRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async countPendingWork(): Promise<GobiernoCountersEntity> {
    const [[denuncias], [buscados], [multas], [apelaciones]] =
      await Promise.all([
        this.db
          .select({ c: sql<number>`count(*)` })
          .from(gobiernoDenuncias)
          .where(
            notInArray(gobiernoDenuncias.status, ['resolved', 'dismissed']),
          ),
        this.db
          .select({ c: sql<number>`count(*)` })
          .from(gobiernoBuscados)
          .where(eq(gobiernoBuscados.status, 'active')),
        this.db
          .select({ c: sql<number>`count(*)` })
          .from(gobiernoMultas)
          .where(eq(gobiernoMultas.status, 'pending')),
        this.db
          .select({ c: sql<number>`count(*)` })
          .from(gobiernoApelaciones)
          .where(inArray(gobiernoApelaciones.status, ['pending', 'reviewing'])),
      ]);

    return {
      denuncias: Number(denuncias?.c ?? 0),
      buscados: Number(buscados?.c ?? 0),
      multas: Number(multas?.c ?? 0),
      apelaciones: Number(apelaciones?.c ?? 0),
    };
  }
}
