import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditRepository } from '@api/_repositories/boffmedia/audit.repository';
import { AUDIT_SUBJECT } from '@/_db/schema/BoffMediaEvents';
import {
  REPORT_REASON,
  REPORT_STATUS,
  SANCTION_KIND,
} from '@/_db/schema/BoffMediaModeration';
import { NotificationsService } from '../notifications/notifications.service';
import { excerptOf, ModerationService } from './moderation.service';
import { ModerationRepository } from './repositories/moderation.repository';

/**
 * The four properties W10 has to hold, none of which need a database:
 * one report per user per item, one queue over many surfaces, a hide that
 * comes back, and an audit row for every decision.
 */
describe('ModerationService', () => {
  let service: ModerationService;
  let repo: jest.Mocked<Partial<ModerationRepository>>;
  let audit: { record: jest.Mock };
  let notifications: { create: jest.Mock };

  const CONTENT = {
    id: 412,
    excerpts: ['<b>Compra</b> seguidores baratos'],
    authorUserId: 99,
    authorUuid: null,
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
    hiddenByColumn: false,
  };

  beforeEach(async () => {
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    notifications = { create: jest.fn().mockResolvedValue({ created: 1 }) };

    repo = {
      loadContent: jest.fn().mockResolvedValue(CONTENT),
      findReportByReporter: jest.fn().mockResolvedValue(undefined),
      upsertReport: jest.fn().mockResolvedValue(undefined),
      listOpenReporterIds: jest.fn().mockResolvedValue([7]),
      listReportsForContent: jest.fn().mockResolvedValue([
        {
          id: 1,
          reporterUserId: 7,
          reporterUsername: 'nia',
          reason: REPORT_REASON.SPAM,
          detail: null,
          authorUserId: 99,
          authorUuid: null,
          createdAt: new Date('2026-09-02T00:00:00.000Z'),
        },
      ]),
      resolveReports: jest.fn().mockResolvedValue(1),
      setHidden: jest.fn().mockResolvedValue(undefined),
      setSurfaceHideColumn: jest.fn().mockResolvedValue(undefined),
      findModeration: jest.fn().mockResolvedValue(undefined),
      insertSanction: jest.fn().mockResolvedValue(55),
      findActiveContentBan: jest.fn().mockResolvedValue(undefined),
      listSanctions: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        { provide: ModerationRepository, useValue: repo },
        { provide: AuditRepository, useValue: audit },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    service = module.get(ModerationService);
  });

  // ─── one report per user per item ─────────────────────────────────────────

  describe('the dedupe rule', () => {
    it('acknowledges a first report as new', async () => {
      const ack = await service.report(7, {
        contentType: 'forum_post',
        contentId: '412',
        reason: REPORT_REASON.SPAM,
      });

      expect(ack).toEqual({ received: true, duplicate: false });
      expect(repo.upsertReport).toHaveBeenCalledTimes(1);
    });

    it('updates rather than duplicating when the same person reports again', async () => {
      (repo.findReportByReporter as jest.Mock).mockResolvedValue({
        id: 1,
        reason: REPORT_REASON.SPAM,
      });

      const ack = await service.report(7, {
        contentType: 'forum_post',
        contentId: '412',
        reason: REPORT_REASON.HARASSMENT,
        detail: 'sigue igual',
      });

      // Still exactly one write, and it carries the NEW reason: the second
      // report replaces the first instead of inflating the queue's count,
      // which is what keeps "reported 4 times" a count of people.
      expect(ack.duplicate).toBe(true);
      expect(repo.upsertReport).toHaveBeenCalledTimes(1);
      expect(repo.upsertReport).toHaveBeenCalledWith(
        expect.objectContaining({ reason: REPORT_REASON.HARASSMENT }),
      );
    });

    it('snapshots the author onto the report', async () => {
      await service.report(7, {
        contentType: 'forum_post',
        contentId: '412',
        reason: REPORT_REASON.SPAM,
      });

      // Denormalised at report time so the author's history survives the
      // content being hidden or deleted.
      expect(repo.upsertReport).toHaveBeenCalledWith(
        expect.objectContaining({ authorUserId: 99, authorUuid: null }),
      );
    });

    it('refuses a self-report', async () => {
      await expect(
        service.report(99, {
          contentType: 'forum_post',
          contentId: '412',
          reason: REPORT_REASON.SPAM,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.upsertReport).not.toHaveBeenCalled();
    });
  });

  // ─── generic (content_type, content_id) resolution ────────────────────────

  describe('surface resolution', () => {
    it('sends a report to whichever surface the content type names', async () => {
      await service.report(7, {
        contentType: 'rooker_post',
        contentId: '3',
        reason: REPORT_REASON.HATE,
      });

      const [surface, id] = (repo.loadContent as jest.Mock).mock.calls[0];
      expect(surface.contentType).toBe('rooker_post');
      expect(id).toBe(3);
    });

    it('refuses a content type no surface is registered for', async () => {
      await expect(
        service.report(7, {
          contentType: 'rotom_chat_messages',
          contentId: '1',
          reason: REPORT_REASON.SPAM,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.loadContent).not.toHaveBeenCalled();
    });

    it('refuses an id the surface could not have', async () => {
      await expect(
        service.report(7, {
          contentType: 'forum_post',
          contentId: 'nope',
          reason: REPORT_REASON.SPAM,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.loadContent).not.toHaveBeenCalled();
    });

    it('refuses a report against content that is already gone', async () => {
      (repo.loadContent as jest.Mock).mockResolvedValue(null);

      await expect(
        service.report(7, {
          contentType: 'forum_post',
          contentId: '412',
          reason: REPORT_REASON.SPAM,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // ─── hide / unhide reversibility ──────────────────────────────────────────

  describe('hiding', () => {
    it('latches the ledger and the surface column, deleting nothing', async () => {
      await service.hide('forum_post', '412', 'spam', 1);

      expect(repo.setHidden).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'forum_post',
          contentId: '412',
          hiddenByUserId: 1,
          hiddenReason: 'spam',
          hiddenAt: expect.any(Date),
        }),
      );
      // forum_post hides through its own `deleted_at`; nothing is deleted.
      expect(repo.setSurfaceHideColumn).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: 'forum_post' }),
        412,
        expect.any(Date),
      );
    });

    it('does not touch a surface column when the surface has none', async () => {
      await service.hide('rooker_post', '3', 'spam', 1);

      // Rooker has no hide column: the ledger alone carries the decision and
      // the read paths consult it.
      expect(repo.setHidden).toHaveBeenCalled();
      expect(repo.setSurfaceHideColumn).not.toHaveBeenCalled();
    });

    it('reverses cleanly: unhide clears both latches', async () => {
      (repo.findModeration as jest.Mock).mockResolvedValue({
        contentType: 'forum_post',
        contentId: '412',
        hiddenAt: new Date(),
      });

      await service.unhide('forum_post', '412', 'apelación aceptada', 1);

      expect(repo.setHidden).toHaveBeenCalledWith(
        expect.objectContaining({ hiddenAt: null }),
      );
      expect(repo.setSurfaceHideColumn).toHaveBeenCalledWith(
        expect.objectContaining({ contentType: 'forum_post' }),
        412,
        null,
      );
    });

    it('refuses to unhide something moderation never hid', async () => {
      (repo.findModeration as jest.Mock).mockResolvedValue(undefined);

      // On the forum the hide column is `deleted_at`, which the AUTHOR can also
      // set. Without this check an unhide would resurrect a post its author
      // deleted themselves.
      await expect(
        service.unhide('forum_post', '412', 'porque sí', 1),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(repo.setSurfaceHideColumn).not.toHaveBeenCalled();
    });
  });

  // ─── every action writes its audit row ────────────────────────────────────

  describe('the audit trail', () => {
    it('records a dismissal against the report', async () => {
      await service.dismiss('forum_post', '412', 'sin motivo', 1);

      expect(audit.record).toHaveBeenCalledWith(
        AUDIT_SUBJECT.REPORT,
        1,
        'report.dismiss',
        1,
        expect.objectContaining({
          contentType: 'forum_post',
          contentId: '412',
          reason: 'sin motivo',
        }),
      );
    });

    it('records a hide against the content', async () => {
      await service.hide('forum_post', '412', 'spam', 1);

      expect(audit.record).toHaveBeenCalledWith(
        AUDIT_SUBJECT.CONTENT,
        412,
        'content.hide',
        1,
        expect.objectContaining({ contentType: 'forum_post', reason: 'spam' }),
      );
    });

    it('records an unhide against the content', async () => {
      (repo.findModeration as jest.Mock).mockResolvedValue({
        hiddenAt: new Date(),
      });

      await service.unhide('forum_post', '412', 'revisado', 1);

      expect(audit.record).toHaveBeenCalledWith(
        AUDIT_SUBJECT.CONTENT,
        412,
        'content.unhide',
        1,
        expect.objectContaining({ contentType: 'forum_post' }),
      );
    });

    it('records a sanction against the author, not the post', async () => {
      await service.sanction(
        {
          contentType: 'forum_post',
          contentId: '412',
          kind: SANCTION_KIND.CONTENT_BAN,
          reason: 'spam reiterado',
          days: 7,
        },
        1,
      );

      // "What has been done to this person" has to be answerable across every
      // item they ever posted, so the subject is the account.
      expect(audit.record).toHaveBeenCalledWith(
        AUDIT_SUBJECT.USER,
        99,
        'moderation.content_ban',
        1,
        expect.objectContaining({ sanctionId: 55 }),
      );
      expect(repo.insertSanction).toHaveBeenCalledWith(
        expect.objectContaining({
          subjectUserId: 99,
          kind: SANCTION_KIND.CONTENT_BAN,
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('never lets a broken notification sink the decision', async () => {
      notifications.create.mockRejectedValue(new Error('db down'));

      // The content is already down by the time the courtesy message is sent.
      // Failing the request here would tell the admin the hide did not happen
      // when it did — and they would click again. (The audit write has the same
      // rule, enforced one layer down: `AuditService.record` swallows and logs,
      // so `AuditRepository.record` never rejects in the first place.)
      await expect(
        service.hide('rooker_post', '3', 'spam', 1),
      ).resolves.toEqual({ success: true });
    });
  });

  // ─── feedback to the reporter ─────────────────────────────────────────────

  describe('reporter feedback', () => {
    it('tells everyone who reported it that it was looked at', async () => {
      (repo.listOpenReporterIds as jest.Mock).mockResolvedValue([7, 8]);

      await service.dismiss('forum_post', '412', 'sin motivo', 1);

      expect(notifications.create).toHaveBeenCalledTimes(2);
      expect(notifications.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 7, type: 'system' }),
        'moderation:report:forum_post:412:7',
      );
    });

    it('collects the reporters BEFORE closing their reports', async () => {
      const order: string[] = [];
      (repo.listOpenReporterIds as jest.Mock).mockImplementation(async () => {
        order.push('read');
        return [7];
      });
      (repo.resolveReports as jest.Mock).mockImplementation(async () => {
        order.push('close');
        return 1;
      });

      await service.dismiss('forum_post', '412', 'sin motivo', 1);

      // Reading after the update would find zero open reports and nobody
      // would ever hear back — the exact failure that makes people stop
      // reporting.
      expect(order).toEqual(['read', 'close']);
    });

    it('says nothing about what was decided', async () => {
      await service.dismiss('forum_post', '412', 'motivo interno', 1);

      const [payload] = notifications.create.mock.calls[0];
      // The admin's reason is an internal note. Echoing it back turns a report
      // button into a way to interrogate moderation.
      expect(JSON.stringify(payload)).not.toContain('motivo interno');
    });
  });

  // ─── enforcement ──────────────────────────────────────────────────────────

  describe('content bans', () => {
    it('lets an unsanctioned account post', async () => {
      await expect(
        service.assertCanCreateContent({ userId: 5 }),
      ).resolves.toBeUndefined();
    });

    it('stops an account under a live ban', async () => {
      (repo.findActiveContentBan as jest.Mock).mockResolvedValue({
        id: 1,
        kind: SANCTION_KIND.CONTENT_BAN,
      });

      await expect(
        service.assertCanCreateContent({ userId: 5 }),
      ).rejects.toThrow();
    });
  });

  // ─── what the admin is shown ──────────────────────────────────────────────

  describe('excerpts', () => {
    it('strips markup so the console never renders author-controlled HTML', () => {
      // The stored HTML is sanitised on write, but re-rendering it inside the
      // one session that can ban people is not a risk worth carrying for a
      // table cell.
      expect(excerptOf(['<a href="#">Compra</a>  <b>ya</b>'])).toBe('Compra ya');
    });

    it('joins a surface’s columns and drops the empty ones', () => {
      // Rooker posts carry text AND a media url, and either can be null.
      expect(excerptOf([null, 'https://x/y.png'])).toBe('https://x/y.png');
      expect(excerptOf([null, null])).toBeNull();
    });
  });

  // ─── the queue ────────────────────────────────────────────────────────────

  describe('the queue', () => {
    it('defaults to open reports, worst first', async () => {
      const listQueue = jest
        .fn()
        .mockResolvedValue({ rows: [], total: 0 });
      (repo as { listQueue?: unknown }).listQueue = listQueue;

      await service.queue({});

      expect(listQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          status: REPORT_STATUS.OPEN,
          sort: 'reports',
          limit: 20,
          offset: 0,
        }),
      );
    });
  });
});
