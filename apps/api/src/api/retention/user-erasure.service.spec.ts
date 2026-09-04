import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { AuditService } from '@api/_repositories/audit.service';
import { DataExportService } from '@api/boffmedia/data-export/data-export.service';

import { UserErasureRepository } from './repositories/user-erasure.repository';
import { UserErasureService } from './user-erasure.service';

// The window is read from `env` at call time, so the mock is a plain mutable
// object the tests reassign. Mocking the module (rather than process.env) keeps
// the zod parse out of this file entirely.
const mockEnv = { RETENTION_DELETED_USER_DAYS: 30 };
jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

const DAY_MS = 24 * 60 * 60 * 1000;
const TOMBSTONE_ID = 999;

const moved = { threads: 0, posts: 0, reportsDeleted: 0, sanctions: 0 };

describe('UserErasureService', () => {
  let service: UserErasureService;
  let repo: jest.Mocked<UserErasureRepository>;
  let audit: jest.Mocked<AuditService>;
  let dataExport: jest.Mocked<DataExportService>;

  beforeEach(async () => {
    mockEnv.RETENTION_DELETED_USER_DAYS = 30;

    repo = {
      ensureTombstoneUserId: jest.fn().mockResolvedValue(TOMBSTONE_ID),
      findDueForErasure: jest.fn().mockResolvedValue([]),
      countUploads: jest.fn().mockResolvedValue(0),
      erase: jest.fn().mockResolvedValue(moved),
    } as unknown as jest.Mocked<UserErasureRepository>;

    audit = { record: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<AuditService>;
    dataExport = {
      purgeForUser: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<DataExportService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserErasureService,
        { provide: UserErasureRepository, useValue: repo },
        { provide: AuditService, useValue: audit },
        { provide: DataExportService, useValue: dataExport },
        {
          provide: Logger,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UserErasureService);
  });

  describe('the retention cutoff', () => {
    it('is exactly RETENTION_DELETED_USER_DAYS before now', async () => {
      const now = new Date('2026-09-04T03:00:00.000Z');

      await service.sweep(now);

      const [cutoff] = repo.findDueForErasure.mock.calls[0];
      // 2026-08-05T03:00:00Z — 30 days earlier to the millisecond. An off-by-one
      // here is a day of somebody's data kept or thrown away early, and neither
      // shows up anywhere else.
      expect(cutoff.toISOString()).toBe('2026-08-05T03:00:00.000Z');
      expect(now.getTime() - cutoff.getTime()).toBe(30 * DAY_MS);
    });

    it('moves with the configured window', async () => {
      mockEnv.RETENTION_DELETED_USER_DAYS = 7;
      const now = new Date('2026-09-04T03:00:00.000Z');

      await service.sweep(now);

      const [cutoff] = repo.findDueForErasure.mock.calls[0];
      expect(now.getTime() - cutoff.getTime()).toBe(7 * DAY_MS);
    });

    it('does nothing at all when the window is 0', async () => {
      mockEnv.RETENTION_DELETED_USER_DAYS = 0;

      const erased = await service.sweep(new Date());

      expect(erased).toBe(0);
      // Not even the tombstone lookup: a disabled job must not write rows.
      expect(repo.ensureTombstoneUserId).not.toHaveBeenCalled();
      expect(repo.findDueForErasure).not.toHaveBeenCalled();
      expect(repo.erase).not.toHaveBeenCalled();
    });

    it('never erases the tombstone account itself', async () => {
      // The tombstone carries a `deleted_at` of its own, so it is inside every
      // cutoff forever. Excluding it is the difference between a quiet sweep and
      // a foreign-key error every night.
      await service.sweep(new Date());

      const [, excludedId] = repo.findDueForErasure.mock.calls[0];
      expect(excludedId).toBe(TOMBSTONE_ID);
    });
  });

  describe('erasing an account', () => {
    const due = [
      { id: 1, deletedAt: new Date('2026-07-01T00:00:00.000Z') },
      { id: 2, deletedAt: new Date('2026-07-02T00:00:00.000Z') },
    ];

    beforeEach(() => {
      repo.findDueForErasure.mockResolvedValue(due);
      repo.erase.mockResolvedValue({
        threads: 3,
        posts: 12,
        reportsDeleted: 1,
        sanctions: 0,
      });
      dataExport.purgeForUser.mockResolvedValue(2);
      repo.countUploads.mockResolvedValue(5);
    });

    it('deletes the export archives BEFORE the row that names them', async () => {
      await service.sweep(new Date());

      // `boffmedia_data_exports` cascades on the user, so deleting the account
      // first destroys the only record of which files are on disk.
      const purgeOrder = dataExport.purgeForUser.mock.invocationCallOrder[0];
      const eraseOrder = repo.erase.mock.invocationCallOrder[0];
      expect(purgeOrder).toBeLessThan(eraseOrder);
    });

    it('reassigns restricted references to the tombstone', async () => {
      await service.sweep(new Date());

      expect(repo.erase).toHaveBeenCalledWith(1, TOMBSTONE_ID);
      expect(repo.erase).toHaveBeenCalledWith(2, TOMBSTONE_ID);
    });

    it('audits counts, never personal data', async () => {
      await service.sweep(new Date());

      expect(audit.record).toHaveBeenCalledTimes(2);
      const [first] = audit.record.mock.calls[0];
      expect(first).toMatchObject({
        domain: 'boffmedia',
        subjectType: 'user',
        subjectId: 1,
        action: 'user.erased',
        // The scheduler did this, not a person.
        actor: null,
      });
      expect(first.metadata).toMatchObject({
        retentionDays: 30,
        forumThreadsReassigned: 3,
        forumPostsReassigned: 12,
        contentReportsDeleted: 1,
        dataExportArchivesDeleted: 2,
        uploadFilesLeftOnDisk: 5,
      });
      // Nothing in the trail may identify the person whose account just went.
      const serialised = JSON.stringify(first.metadata);
      expect(serialised).not.toMatch(/@/);
      expect(serialised).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/i);
    });

    it('reports how many it erased', async () => {
      expect(await service.sweep(new Date())).toBe(2);
    });

    it('carries on when one account fails, and leaves it due', async () => {
      repo.erase.mockRejectedValueOnce(new Error('ER_ROW_IS_REFERENCED_2'));

      const erased = await service.sweep(new Date());

      // The second account still went. The first keeps its `deleted_at`, so the
      // next pass picks it up again — a failure must not silently drop an
      // account out of the retention promise.
      expect(erased).toBe(1);
      expect(repo.erase).toHaveBeenCalledTimes(2);
      expect(audit.record).toHaveBeenCalledTimes(1);
    });

    it('does not audit an erasure that did not happen', async () => {
      repo.erase.mockRejectedValue(new Error('lock wait timeout'));

      await service.sweep(new Date());

      expect(audit.record).not.toHaveBeenCalled();
    });
  });
});
