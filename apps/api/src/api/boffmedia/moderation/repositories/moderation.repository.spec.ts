import { Test, TestingModule } from '@nestjs/testing';
import { getTableConfig } from 'drizzle-orm/mysql-core';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { REPORT_REASON, REPORT_STATUS } from '@/_db/schema/BoffMediaModeration';
import { findSurface } from '../content-registry';
import { ModerationRepository } from './moderation.repository';

/**
 * Two traps live in this file and both are invisible in TypeScript:
 *
 * 1. the dedupe rule is `ON DUPLICATE KEY UPDATE`, not a read-then-write;
 * 2. Drizzle's `.set()` is keyed on JS PROPERTY names and silently drops a key
 *    it does not recognise — so hiding through the SQL column name would report
 *    success and leave the content up.
 *
 * Both are asserted by looking at what the repository hands Drizzle, the same
 * technique `tcg.repository.spec.ts` uses for its column mapping.
 */
describe('ModerationRepository — what it hands Drizzle', () => {
  let repository: ModerationRepository;
  let insertedInto: unknown;
  let insertedValues: Record<string, unknown> | undefined;
  let duplicateSet: Record<string, unknown> | undefined;
  let updatedTable: unknown;
  let updatedSet: Record<string, unknown> | undefined;

  const db = {
    insert: jest.fn((table: unknown) => {
      insertedInto = table;
      return {
        values: (values: Record<string, unknown>) => {
          insertedValues = values;
          return {
            onDuplicateKeyUpdate: (arg: { set: Record<string, unknown> }) => {
              duplicateSet = arg.set;
              return Promise.resolve(undefined);
            },
            $returningId: () => Promise.resolve([{ id: 1 }]),
            then: (resolve: (v: unknown) => unknown) => resolve(undefined),
          };
        },
      };
    }),
    update: jest.fn((table: unknown) => {
      updatedTable = table;
      return {
        set: (values: Record<string, unknown>) => {
          updatedSet = values;
          return {
            where: () => Promise.resolve([{ affectedRows: 1 }]),
          };
        },
      };
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    insertedValues = undefined;
    duplicateSet = undefined;
    updatedSet = undefined;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationRepository,
        { provide: DRIZZLE, useValue: db },
      ],
    }).compile();

    repository = module.get(ModerationRepository);
  });

  describe('the dedupe rule', () => {
    it('upserts against the unique key instead of inserting twice', async () => {
      await repository.upsertReport({
        contentType: 'forum_post',
        contentId: '412',
        reporterUserId: 7,
        reason: REPORT_REASON.SPAM,
        detail: 'otra vez',
        authorUserId: 99,
        authorUuid: null,
      });

      expect(getTableConfig(insertedInto as never).name).toBe(
        'boffmedia_content_reports',
      );
      expect(insertedValues).toMatchObject({
        contentType: 'forum_post',
        contentId: '412',
        reporterUserId: 7,
      });
      // Without this branch the second report from the same person is either a
      // duplicate row (inflating the queue's count) or a 500.
      expect(duplicateSet).toMatchObject({
        reason: REPORT_REASON.SPAM,
        detail: 'otra vez',
        status: REPORT_STATUS.OPEN,
      });
    });

    it('reopens a report the same person had already had resolved', async () => {
      await repository.upsertReport({
        contentType: 'forum_post',
        contentId: '412',
        reporterUserId: 7,
        reason: REPORT_REASON.HARASSMENT,
        detail: null,
        authorUserId: 99,
        authorUuid: null,
      });

      // The content is still up and they still object, so it belongs back in
      // the queue rather than swallowed by a stale `dismissed`.
      expect(duplicateSet).toMatchObject({
        status: REPORT_STATUS.OPEN,
        resolution: null,
        resolvedAt: null,
        resolvedByUserId: null,
      });
    });
  });

  describe('hiding through a surface column', () => {
    it('writes the JS property name, not the SQL column name', async () => {
      const surface = findSurface('forum_post')!;
      const when = new Date('2026-09-04T10:00:00.000Z');

      await repository.setSurfaceHideColumn(surface, 412, when);

      expect(getTableConfig(updatedTable as never).name).toBe(
        'boffmedia_forum_posts',
      );
      // `deletedAt`, never `deleted_at`: Drizzle matches `.set()` keys against
      // property names and ignores anything else WITHOUT erroring, so the SQL
      // name would update nothing and still resolve.
      expect(Object.keys(updatedSet ?? {})).toEqual(['deletedAt']);
      expect(updatedSet?.deletedAt).toBe(when);
    });

    it('reverses by writing null, never by deleting the row', async () => {
      const surface = findSurface('forum_thread')!;

      await repository.setSurfaceHideColumn(surface, 3, null);

      expect(updatedSet).toEqual({ deletedAt: null });
      // An `update`, not a `delete` — the whole point of a reversible hide.
      expect(db.update).toHaveBeenCalled();
    });

    it('refuses a surface whose hide strategy has no column', async () => {
      const surface = findSurface('rooker_post')!;

      await expect(
        repository.setSurfaceHideColumn(surface, 3, new Date()),
      ).rejects.toThrow(/hide strategy 'column'/);
    });
  });

  describe('the hide ledger', () => {
    it('upserts so an unhide keeps the row that says who hid it', async () => {
      await repository.setHidden({
        contentType: 'rooker_post',
        contentId: '3',
        hiddenAt: null,
        hiddenByUserId: 1,
        hiddenReason: 'apelación aceptada',
      });

      expect(getTableConfig(insertedInto as never).name).toBe(
        'boffmedia_content_moderation',
      );
      // Clearing the latch, not removing the record: the reason and the
      // decision have to survive the content coming back.
      expect(duplicateSet).toMatchObject({
        hiddenAt: null,
        hiddenByUserId: 1,
      });
    });
  });
});
