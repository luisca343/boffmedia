import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';
import { AUDIT_SUBJECT } from '@/_db/schema/BoffMediaEvents';
import { REPORT_STATUS, SANCTION_KIND } from '@/_db/schema/BoffMediaModeration';
import { NotificationsService } from '../notifications/notifications.service';
import { ContentSurface, findSurface } from './content-registry';
import {
  authorKey,
  ModerationRepository,
  QueueGroupRow,
} from './repositories/moderation.repository';
import {
  CreateContentReportDto,
  CreateSanctionDto,
  ModerationQueueQueryDto,
} from './dto/moderation.dto';
import {
  ModerationItemDetailEntity,
  ModerationQueueItemEntity,
  ModerationQueuePageEntity,
  ReportAcknowledgementEntity,
} from './entities/moderation.entity';

/** Characters of the content shown in the queue before it is cut. */
const EXCERPT_LENGTH = 400;

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly repo: ModerationRepository,
    private readonly audit: AuditRepository,
    private readonly notifications: NotificationsService,
  ) {}

  // ─── reporting ────────────────────────────────────────────────────────────

  /**
   * Files a report from a signed-in user.
   *
   * The content is loaded before the report is written, for two reasons: a
   * report against something that does not exist is noise the queue can never
   * resolve, and the author has to be snapshotted onto the row at this moment
   * (see the comment on the schema's `author_user_id`).
   */
  async report(
    reporterUserId: number,
    dto: CreateContentReportDto,
  ): Promise<ReportAcknowledgementEntity> {
    const { surface, id } = this.resolveTarget(dto.contentType, dto.contentId);
    const content = await this.repo.loadContent(surface, id);
    if (!content) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.MODERATION_CONTENT_NOT_FOUND,
          'the reported content no longer exists',
        ),
      );
    }

    // Not a moral rule, a queue-hygiene one: self-reports are how people test
    // the button, and every one of them costs an admin a look.
    if (
      content.authorUserId != null &&
      content.authorUserId === reporterUserId
    ) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.MODERATION_SELF_REPORT,
          'you cannot report your own content',
        ),
      );
    }

    const existing = await this.repo.findReportByReporter(
      dto.contentType,
      dto.contentId,
      reporterUserId,
    );

    await this.repo.upsertReport({
      contentType: dto.contentType,
      contentId: dto.contentId,
      reporterUserId,
      reason: dto.reason,
      detail: dto.detail ?? null,
      authorUserId: content.authorUserId,
      authorUuid: content.authorUuid,
    });

    return { received: true, duplicate: Boolean(existing) };
  }

  // ─── the queue ────────────────────────────────────────────────────────────

  async queue(
    query: ModerationQueueQueryDto,
  ): Promise<ModerationQueuePageEntity> {
    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const { rows, total } = await this.repo.listQueue({
      status: query.status ?? REPORT_STATUS.OPEN,
      contentType: query.contentType,
      sort: query.sort ?? 'reports',
      limit,
      offset,
    });

    const items = await this.enrich(rows);
    return { items, total, limit, offset };
  }

  async detail(
    contentType: string,
    contentId: string,
  ): Promise<ModerationItemDetailEntity> {
    const reports = await this.repo.listReportsForContent(
      contentType,
      contentId,
    );
    if (reports.length === 0) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.MODERATION_REPORT_NOT_FOUND,
          'no report exists for that content',
        ),
      );
    }

    const [item] = await this.enrich([
      {
        contentType,
        contentId,
        reportCount: reports.length,
        firstReportedAt: reports[reports.length - 1].createdAt,
        lastReportedAt: reports[0].createdAt,
        authorUserId: reports[0].authorUserId,
        authorUuid: reports[0].authorUuid,
        reasons: [...new Set(reports.map((r) => r.reason))].join(','),
      },
    ]);

    const sanctions = await this.repo.listSanctions({
      userId: reports[0].authorUserId,
      uuid: reports[0].authorUuid,
    });

    return {
      ...item,
      reporters: reports.map((r) => ({
        userId: r.reporterUserId,
        username: r.reporterUsername,
        reason: r.reason,
        detail: r.detail,
        createdAt: r.createdAt.toISOString(),
      })),
      authorSanctions: sanctions.map((s) => ({
        id: s.id,
        kind: s.kind,
        reason: s.reason,
        expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
        revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }

  // ─── decisions ────────────────────────────────────────────────────────────

  /**
   * Closes the reports and leaves the content alone.
   *
   * No step-up: dismissing changes nothing anyone can see, and it is undone by
   * anyone reporting the item again — which reopens it (see `upsertReport`).
   */
  async dismiss(
    contentType: string,
    contentId: string,
    reason: string,
    adminUserId: number,
  ): Promise<{ success: true }> {
    this.resolveTarget(contentType, contentId);
    // Read the reports before closing them: the audit row points at a real
    // report id, and the reporters have to be collected while their rows still
    // say `open`.
    const reports = await this.repo.listReportsForContent(
      contentType,
      contentId,
    );
    const reporters = await this.repo.listOpenReporterIds(
      contentType,
      contentId,
    );
    const closed = await this.repo.resolveReports({
      contentType,
      contentId,
      status: REPORT_STATUS.DISMISSED,
      resolution: reason,
      resolvedByUserId: adminUserId,
    });
    if (closed === 0) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.MODERATION_REPORT_NOT_FOUND,
          'no open report exists for that content',
        ),
      );
    }

    await this.audit.record(
      AUDIT_SUBJECT.REPORT,
      reports[0]?.id ?? 0,
      'report.dismiss',
      adminUserId,
      { contentType, contentId, reason, reportsClosed: closed },
    );
    await this.notifyReporters(reporters, contentType, contentId, 'dismissed');
    return { success: true };
  }

  /**
   * Takes the content out of view without deleting a byte of it.
   *
   * Two writes, in this order: the ledger first, the surface second. If the
   * second fails the item is still visible but the ledger says it should not
   * be, which an admin can see and retry. The other order would hide content
   * with no record of who did it or why.
   */
  async hide(
    contentType: string,
    contentId: string,
    reason: string,
    adminUserId: number,
  ): Promise<{ success: true }> {
    const { surface, id } = this.resolveTarget(contentType, contentId);
    const content = await this.repo.loadContent(surface, id);
    if (!content) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.MODERATION_CONTENT_NOT_FOUND,
          'the content no longer exists',
        ),
      );
    }

    const now = new Date();
    await this.repo.setHidden({
      contentType,
      contentId,
      hiddenAt: now,
      hiddenByUserId: adminUserId,
      hiddenReason: reason,
    });
    if (surface.hide === 'column') {
      await this.repo.setSurfaceHideColumn(surface, id, now);
    }

    const reporters = await this.repo.listOpenReporterIds(
      contentType,
      contentId,
    );
    const closed = await this.repo.resolveReports({
      contentType,
      contentId,
      status: REPORT_STATUS.ACTIONED,
      resolution: reason,
      resolvedByUserId: adminUserId,
    });

    await this.audit.record(
      AUDIT_SUBJECT.CONTENT,
      auditableId(id),
      'content.hide',
      adminUserId,
      { contentType, contentId, reason, reportsClosed: closed },
    );
    await this.notifyReporters(reporters, contentType, contentId, 'actioned');
    return { success: true };
  }

  /**
   * Puts it back.
   *
   * Refuses when the ledger has no hide on record. On a `column` surface the
   * column is shared with the author's own delete, so an unconditional unhide
   * would resurrect something the author removed themselves — the ledger is
   * the only thing that can tell the two apart.
   */
  async unhide(
    contentType: string,
    contentId: string,
    reason: string,
    adminUserId: number,
  ): Promise<{ success: true }> {
    const { surface, id } = this.resolveTarget(contentType, contentId);
    const ledger = await this.repo.findModeration(contentType, contentId);
    if (!ledger?.hiddenAt) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.MODERATION_NOT_HIDDEN,
          'that content was not hidden by moderation',
        ),
      );
    }

    await this.repo.setHidden({
      contentType,
      contentId,
      hiddenAt: null,
      hiddenByUserId: adminUserId,
      hiddenReason: reason,
    });
    if (surface.hide === 'column') {
      await this.repo.setSurfaceHideColumn(surface, id, null);
    }

    await this.audit.record(
      AUDIT_SUBJECT.CONTENT,
      auditableId(id),
      'content.unhide',
      adminUserId,
      { contentType, contentId, reason },
    );
    return { success: true };
  }

  /**
   * Acts on the author rather than the post.
   *
   * Behind the step-up guard, unlike the other three: hiding and dismissing are
   * one item and one click to undo, while a content ban stops a person
   * participating from the moment it lands. It is also the action a borrowed
   * admin session is worth stealing for, which is the test the existing
   * step-up sites are chosen by.
   */
  async sanction(
    dto: CreateSanctionDto,
    adminUserId: number,
  ): Promise<{ success: true; sanctionId: number }> {
    const { surface, id } = this.resolveTarget(dto.contentType, dto.contentId);
    const content = await this.repo.loadContent(surface, id);
    const reports = await this.repo.listReportsForContent(
      dto.contentType,
      dto.contentId,
    );

    // The author comes from the content while it still exists, and from the
    // report's snapshot once it does not — sanctioning has to stay possible
    // after the post is gone, which is often exactly when it is decided.
    const subjectUserId =
      content?.authorUserId ?? reports[0]?.authorUserId ?? null;
    const subjectUuid = content?.authorUuid ?? reports[0]?.authorUuid ?? null;
    if (subjectUserId == null && !subjectUuid) {
      throw new NotFoundException(
        userError(
          ApiErrorCode.MODERATION_AUTHOR_UNKNOWN,
          'the author of that content cannot be identified',
        ),
      );
    }

    const expiresAt =
      dto.kind === SANCTION_KIND.CONTENT_BAN && dto.days
        ? new Date(Date.now() + dto.days * 24 * 60 * 60 * 1000)
        : null;

    const sanctionId = await this.repo.insertSanction({
      subjectUserId,
      subjectUuid,
      kind: dto.kind,
      reason: dto.reason,
      reportId: reports[0]?.id ?? null,
      expiresAt,
      issuedByUserId: adminUserId,
    });

    const reporters = await this.repo.listOpenReporterIds(
      dto.contentType,
      dto.contentId,
    );
    await this.repo.resolveReports({
      contentType: dto.contentType,
      contentId: dto.contentId,
      status: REPORT_STATUS.ACTIONED,
      resolution: dto.reason,
      resolvedByUserId: adminUserId,
    });

    // Subject is the author here, not the report: "what has been done to this
    // person" is the question the trail has to answer later, and it has to
    // answer it across every item they ever posted.
    await this.audit.record(
      AUDIT_SUBJECT.USER,
      subjectUserId ?? 0,
      `moderation.${dto.kind}`,
      adminUserId,
      {
        contentType: dto.contentType,
        contentId: dto.contentId,
        subjectUuid,
        reason: dto.reason,
        expiresAt: expiresAt?.toISOString() ?? null,
        sanctionId,
      },
    );

    if (subjectUserId != null) {
      await this.notify(
        subjectUserId,
        dto.kind === SANCTION_KIND.CONTENT_BAN
          ? 'Se ha restringido tu participación'
          : 'Has recibido un aviso de moderación',
        dto.reason,
        `moderation:sanction:${sanctionId}`,
      );
    }
    await this.notifyReporters(
      reporters,
      dto.contentType,
      dto.contentId,
      'actioned',
    );

    return { success: true, sanctionId };
  }

  // ─── enforcement ──────────────────────────────────────────────────────────

  /**
   * Throws when the account is under a live content ban. Called by
   * `ContentBanGuard`, and directly by any service that creates UGC outside a
   * controller.
   */
  async assertCanCreateContent(subject: {
    userId?: number | null;
    uuid?: string | null;
  }): Promise<void> {
    const ban = await this.repo.findActiveContentBan(subject);
    if (!ban) return;
    throw new ForbiddenException(
      userError(
        ApiErrorCode.MODERATION_CONTENT_BANNED,
        'this account is under a content ban',
      ),
    );
  }

  // ─── internals ────────────────────────────────────────────────────────────

  private resolveTarget(
    contentType: string,
    contentId: string,
  ): { surface: ContentSurface; id: number | string } {
    const surface = findSurface(contentType);
    if (!surface) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.MODERATION_CONTENT_TYPE_UNKNOWN,
          `unknown content type: ${contentType}`,
        ),
      );
    }
    const id = surface.parseId(contentId);
    if (id === null) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.MODERATION_CONTENT_NOT_FOUND,
          `malformed content id for ${contentType}`,
        ),
      );
    }
    return { surface, id };
  }

  /**
   * Turns queue groups into rows an admin can act on: the content itself, the
   * author, and how often that author has been here before.
   *
   * Batched by page rather than per row — a queue of twenty items would
   * otherwise be sixty queries.
   */
  private async enrich(
    groups: QueueGroupRow[],
  ): Promise<ModerationQueueItemEntity[]> {
    if (groups.length === 0) return [];

    const hidden = await this.repo.findHiddenKeys(
      groups.map((g) => ({
        contentType: g.contentType,
        contentId: g.contentId,
      })),
    );

    const userIds = [
      ...new Set(
        groups.map((g) => g.authorUserId).filter((v): v is number => v != null),
      ),
    ];
    const uuids = [
      ...new Set(
        groups.map((g) => g.authorUuid).filter((v): v is string => Boolean(v)),
      ),
    ];
    const [tallies, usernames] = await Promise.all([
      this.repo.authorTallies(userIds, uuids),
      this.repo.usernamesFor(userIds),
    ]);

    const items: ModerationQueueItemEntity[] = [];
    for (const group of groups) {
      const surface = findSurface(group.contentType);
      const id = surface?.parseId(group.contentId) ?? null;
      const content =
        surface && id !== null
          ? await this.repo.loadContent(surface, id)
          : null;

      const key = authorKey(group.authorUserId, group.authorUuid);
      const tally = key ? tallies.get(key) : undefined;
      const bans = await this.repo.findActiveContentBan({
        userId: group.authorUserId,
        uuid: group.authorUuid,
      });
      const sanctions = await this.repo.listSanctions({
        userId: group.authorUserId,
        uuid: group.authorUuid,
      });

      items.push({
        contentType: group.contentType,
        contentId: group.contentId,
        reportCount: Number(group.reportCount),
        reasons: group.reasons ? group.reasons.split(',') : [],
        firstReportedAt: new Date(group.firstReportedAt).toISOString(),
        lastReportedAt: new Date(group.lastReportedAt).toISOString(),
        excerpt: content ? excerptOf(content.excerpts) : null,
        hidden:
          hidden.has(`${group.contentType}:${group.contentId}`) ||
          Boolean(content?.hiddenByColumn),
        contentExists: Boolean(content),
        contentCreatedAt: content?.createdAt
          ? new Date(content.createdAt).toISOString()
          : null,
        author: {
          userId: group.authorUserId,
          uuid: group.authorUuid,
          username:
            group.authorUserId != null
              ? (usernames.get(group.authorUserId) ?? null)
              : null,
          openReports: tally?.openReports ?? 0,
          actionedReports: tally?.actionedReports ?? 0,
          totalReports: tally?.totalReports ?? 0,
          sanctions: sanctions.length,
          contentBanned: Boolean(bans),
        },
      });
    }
    return items;
  }

  /**
   * "We looked at it." Not what was decided — telling a reporter that their
   * target was banned is how a report button becomes a weapon — but silence is
   * what makes people stop reporting at all.
   */
  private async notifyReporters(
    reporterUserIds: number[],
    contentType: string,
    contentId: string,
    outcome: 'dismissed' | 'actioned',
  ): Promise<void> {
    const body =
      outcome === 'actioned'
        ? 'Hemos revisado el contenido que reportaste y hemos tomado medidas. Gracias por avisarnos.'
        : 'Hemos revisado el contenido que reportaste y no hemos encontrado motivo para actuar. Gracias por avisarnos.';

    for (const userId of reporterUserIds) {
      await this.notify(
        userId,
        'Tu reporte ha sido revisado',
        body,
        // One notification per reporter per item: a second decision on the same
        // item refreshes it rather than stacking.
        `moderation:report:${contentType}:${contentId}:${userId}`,
      );
    }
  }

  /**
   * Notifications are a courtesy, never a reason to fail the decision that
   * produced them — same discipline as the audit trail.
   */
  private async notify(
    userId: number,
    title: string,
    body: string,
    dedupeKey: string,
  ): Promise<void> {
    try {
      await this.notifications.create(
        { userId, type: 'system', title, body },
        dedupeKey,
      );
    } catch (error) {
      this.logger.error(
        `moderation notification FAILED (user=${userId}, key=${dedupeKey}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

/**
 * `boffmedia_audit.subject_id` is an `int`, and a content id is only an int on
 * the surfaces registered so far. A surface with a uuid key would land here as
 * 0 — which is why `content_type`/`content_id` also go into `meta`, where they
 * are readable whatever the key's shape.
 */
function auditableId(id: number | string): number {
  return typeof id === 'number' ? id : 0;
}

/**
 * Flattens the surface's text columns into one plain-text excerpt.
 *
 * Tags are stripped rather than escaped: the admin console renders this as
 * text, and leaving markup in makes a spam post's link text unreadable in a
 * table cell for no benefit.
 */
export function excerptOf(values: Array<string | null>): string | null {
  const joined = values
    .filter((v): v is string => Boolean(v))
    .join(' · ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!joined) return null;
  return joined.length > EXCERPT_LENGTH
    ? `${joined.slice(0, EXCERPT_LENGTH)}…`
    : joined;
}
