import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { boffMediaAudit, AuditSubject } from '@/_db/schema/BoffMediaEvents';

/**
 * Admin audit trail for the boffmedia module (events + tournaments).
 *
 * `record` never throws: an unwritable trail must not fail the operation it is
 * describing, which would turn an observability gap into an outage. A failure
 * is logged at error level instead, because a silently missing row is exactly
 * what makes an audit trail worthless later.
 */
@Injectable()
export class AuditRepository {
  private readonly logger = new Logger(AuditRepository.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  async record(
    subjectType: AuditSubject,
    subjectId: number,
    action: string,
    actorUserId: number | null,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    try {
      await this.db.insert(boffMediaAudit).values({
        subjectType,
        subjectId,
        action,
        actorUserId,
        meta: meta ?? null,
      });
    } catch (error) {
      this.logger.error(
        `Audit write FAILED for ${subjectType}#${subjectId} ${action}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
