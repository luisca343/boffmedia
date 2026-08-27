import { Injectable, Inject } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { gobiernoAuditoria } from '@/_db/schema/SmartRotomGobierno';
import { ListAuditoriaQueryDto } from './dto/list-auditoria-query.dto';
import { resolvePageSize } from './dto/paged-query.dto';
import { AuditService } from '@api/_repositories/audit.service';

export interface CreateAuditoriaData {
  actorUuid: string;
  action: string;
  target: string;
  dep: string;
  source?: string;
}

@Injectable()
export class AuditoriaRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  /**
   * Delegates to the unified AuditService to maintain a consistent code path
   * across all audit domains (boffmedia, packs, randomizer, gobierno).
   */
  async log(data: CreateAuditoriaData): Promise<void> {
    await this.auditService.record({
      domain: 'gobierno',
      actor: data.actorUuid,
      action: data.action,
      target: data.target,
      dep: data.dep,
      source: data.source,
    });
  }

  async list(query: ListAuditoriaQueryDto) {
    const page = query.page ?? 1;
    const limit = resolvePageSize(query);

    const conditions = [
      query.dep ? eq(gobiernoAuditoria.dep, query.dep) : undefined,
      query.actorUuid
        ? eq(gobiernoAuditoria.actorUuid, query.actorUuid)
        : undefined,
      query.source ? eq(gobiernoAuditoria.source, query.source) : undefined,
      query.dateFrom
        ? gte(gobiernoAuditoria.createdAt, new Date(query.dateFrom))
        : undefined,
      query.dateTo
        ? lte(gobiernoAuditoria.createdAt, new Date(query.dateTo))
        : undefined,
    ].filter((c) => c !== undefined);
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalRows] = await Promise.all([
      this.db
        .select()
        .from(gobiernoAuditoria)
        .where(where)
        .orderBy(desc(gobiernoAuditoria.createdAt))
        .limit(limit)
        .offset((page - 1) * limit),
      this.db
        .select({ total: sql<number>`count(*)` })
        .from(gobiernoAuditoria)
        .where(where),
    ]);

    return {
      items,
      total: Number(totalRows[0]?.total ?? 0),
      page,
      pageSize: limit,
    };
  }
}
