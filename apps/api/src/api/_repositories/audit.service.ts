import { Inject, Injectable, Logger } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import {
  boffMediaAudit,
  AuditSubject,
} from '@/_db/schema/BoffMediaEvents';
import { packAudit } from '@/_db/schema/Packs';
import { randomizerAudit } from '@/_db/schema/Randomizer';
import { gobiernoAuditoria } from '@/_db/schema/SmartRotomGobierno';

/**
 * Unified audit service with a common vocabulary across all audit domains.
 *
 * Maps a single `record()` call across four independent audit tables:
 * - `boffmedia_audit` (events/tournaments): records admin actions via subject_type + subject_id
 * - `pack_audit` (packs): records access/admin via packId ± Minecraft UUID
 * - `tools_randomizer_audit` (randomizer): records ROM/config lifecycle via configId ± assignmentId
 * - `rotom_gobierno_auditoria` (government): records all actions via department + target
 *
 * Common field vocabulary:
 * - `actor`: the Boffmedia account (int), Minecraft player UUID (string), or 'system' (string)
 * - `subjectType`: entity type being audited (for boffmedia table only)
 * - `subjectId`: entity id being audited (for boffmedia table only)
 * - `action`: what was done (verb phrase like "event.reopen", "config.published")
 * - `metadata`: structured context (domain-specific)
 * - `timestamp`: when it happened (defaults to now)
 *
 * Never throws: an audit failure must not break the operation being audited. Failures
 * are logged at error level instead.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: MySql2Database<Record<string, never>>,
  ) {}

  /**
   * Record an action across any audit domain. Maps common fields to the appropriate table.
   *
   * @param domain - Which audit table ('boffmedia', 'pack', 'randomizer', 'gobierno')
   * @param actor - User ID (int), UUID string, or 'system'; handles null gracefully
   * @param action - What was done
   * @param subjectType - Entity type (boffmedia only) or omitted for other domains
   * @param subjectId - Entity id (boffmedia only) or omitted for other domains
   * @param metadata - Optional context
   * @param timestamp - Optional; defaults to now
   */
  async record(opts: {
    domain: 'boffmedia' | 'pack' | 'randomizer' | 'gobierno';
    actor?: number | string | null;
    action: string;
    subjectType?: AuditSubject;
    subjectId?: number;
    packId?: string | null;
    uuid?: string | null;
    configId?: number | null;
    assignmentId?: number | null;
    target?: string;
    dep?: string;
    source?: string;
    metadata?: Record<string, unknown> | null;
    timestamp?: Date;
  }): Promise<void> {
    try {
      switch (opts.domain) {
        case 'boffmedia':
          if (!opts.subjectType || opts.subjectId === undefined) {
            throw new Error(
              'boffmedia domain requires subjectType and subjectId',
            );
          }
          await this.db.insert(boffMediaAudit).values({
            subjectType: opts.subjectType,
            subjectId: opts.subjectId,
            action: opts.action,
            actorUserId:
              typeof opts.actor === 'number' ? opts.actor : null,
            meta: opts.metadata ?? null,
            // Timestamp defaults to CURRENT_TIMESTAMP() via schema default
          });
          break;

        case 'pack':
          await this.db.insert(packAudit).values({
            packId: opts.packId ?? null,
            userId: typeof opts.actor === 'number' ? opts.actor : null,
            uuid: opts.uuid ?? null,
            action: opts.action,
            meta: opts.metadata ?? null,
          });
          break;

        case 'randomizer':
          await this.db.insert(randomizerAudit).values({
            configId: opts.configId ?? null,
            assignmentId: opts.assignmentId ?? null,
            action: opts.action,
            actor:
              typeof opts.actor === 'string' ? opts.actor : null,
            meta: opts.metadata ?? null,
          });
          break;

        case 'gobierno':
          if (!opts.target || !opts.dep) {
            throw new Error('gobierno domain requires target and dep');
          }
          if (typeof opts.actor !== 'string') {
            throw new Error(
              'gobierno domain requires actor as string (UUID or "system")',
            );
          }
          await this.db.insert(gobiernoAuditoria).values({
            actorUuid: opts.actor,
            action: opts.action,
            target: opts.target,
            dep: opts.dep,
            source: opts.source || 'gobierno',
          });
          break;

        default:
          throw new Error(
            `Unknown audit domain: ${(opts as any).domain}`,
          );
      }
    } catch (error) {
      this.logger.error(
        `Audit write FAILED (domain=${opts.domain}, action=${opts.action}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
