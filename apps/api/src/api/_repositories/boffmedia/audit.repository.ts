import { Inject, Injectable } from '@nestjs/common';
import { AuditSubject } from '@/_db/schema/BoffMediaEvents';
import { AuditService } from '@api/_repositories/audit.service';

/**
 * Admin audit trail for the boffmedia module (events + tournaments).
 *
 * `record` never throws: an unwritable trail must not fail the operation it is
 * describing, which would turn an observability gap into an outage. A failure
 * is logged at error level instead, because a silently missing row is exactly
 * what makes an audit trail worthless later.
 *
 * Delegates to the unified AuditService to maintain a consistent code path
 * across all audit domains (boffmedia, packs, randomizer, gobierno).
 */
@Injectable()
export class AuditRepository {
  constructor(
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  async record(
    subjectType: AuditSubject,
    subjectId: number,
    action: string,
    actorUserId: number | null,
    meta?: Record<string, unknown>,
  ): Promise<void> {
    await this.auditService.record({
      domain: 'boffmedia',
      actor: actorUserId,
      subjectType,
      subjectId,
      action,
      metadata: meta,
    });
  }
}
