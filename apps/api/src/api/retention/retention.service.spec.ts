// Mock prom-client BEFORE importing any service that uses it
jest.mock('prom-client', () => ({
  Counter: jest.fn(() => ({
    inc: jest.fn(),
  })),
  Histogram: jest.fn(() => ({
    observe: jest.fn(),
  })),
}));

// Import after mocking
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { RetentionService } from './retention.service';
import { RetentionRepository } from './repositories/retention.repository';
import { UserErasureService } from './user-erasure.service';
import { DataExportService } from '@api/boffmedia/data-export/data-export.service';

const mockEnv = {
  RETENTION_NOTIFICATIONS_DAYS: 30,
  RETENTION_AUDIT_MONTHS: 12,
  RETENTION_GOBIERNO_AUDIT_MONTHS: 12,
  RETENTION_OUTBOX_DAYS: 7,
  RETENTION_EVENT_INVITES_GRACE_DAYS: 7,
  RETENTION_NOTE_VERSIONS_KEEP: 50,
  RETENTION_DELETED_USER_DAYS: 30,
};

jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

describe('RetentionService', () => {
  let service: RetentionService;
  let repo: jest.Mocked<RetentionRepository>;
  let erasure: jest.Mocked<UserErasureService>;
  let dataExport: jest.Mocked<DataExportService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    repo = {
      claimLease: jest.fn().mockResolvedValue('lease-token-123'),
      releaseLease: jest.fn().mockResolvedValue(undefined),
      deleteOldReadNotifications: jest.fn().mockResolvedValue(0),
      deleteBoffMediaAuditOld: jest.fn().mockResolvedValue(0),
      deletePackAuditOld: jest.fn().mockResolvedValue(0),
      deleteRandomizerAuditOld: jest.fn().mockResolvedValue(0),
      deleteGobiernoAuditoriaOld: jest.fn().mockResolvedValue(0),
      deleteDeliveredOutbox: jest.fn().mockResolvedValue(0),
      deleteExpiredEventInvites: jest.fn().mockResolvedValue(0),
      deleteOldNoteVersions: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<RetentionRepository>;

    erasure = {
      sweep: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<UserErasureService>;

    dataExport = {
      purgeExpired: jest.fn().mockResolvedValue(0),
    } as unknown as jest.Mocked<DataExportService>;

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    } as unknown as jest.Mocked<Logger>;
    (logger as any).info = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionService,
        { provide: RetentionRepository, useValue: repo },
        { provide: UserErasureService, useValue: erasure },
        { provide: DataExportService, useValue: dataExport },
        { provide: Logger, useValue: logger },
      ],
    }).compile();

    service = module.get(RetentionService);
  });

  describe('distributed lease (A8)', () => {
    it('claims a lease at the start of the sweep', async () => {
      await service.sweep();

      expect(repo.claimLease).toHaveBeenCalledWith(
        'boffmedia_retention_sweep',
        90,
      );
    });

    it('skips the sweep if another instance owns the lease', async () => {
      repo.claimLease.mockResolvedValueOnce(null); // Another instance owns it

      await service.sweep();

      // Should not attempt any deletes
      expect(repo.deleteOldReadNotifications).not.toHaveBeenCalled();
      expect(repo.releaseLease).not.toHaveBeenCalled();
    });

    it('skips the sweep if lease claim fails', async () => {
      repo.claimLease.mockRejectedValueOnce(new Error('database error'));

      // The error is caught and logged, sweep returns
      await service.sweep();

      // Should not attempt any deletes
      expect(repo.deleteOldReadNotifications).not.toHaveBeenCalled();
      expect(repo.releaseLease).not.toHaveBeenCalled();
    });

    it('releases the lease after the sweep completes', async () => {
      repo.deleteOldReadNotifications.mockResolvedValueOnce(10);

      await service.sweep();

      expect(repo.releaseLease).toHaveBeenCalledWith(
        'boffmedia_retention_sweep',
        'lease-token-123',
      );
      // Lease release should happen AFTER the deletes
      expect(repo.releaseLease.mock.invocationCallOrder[0]).toBeGreaterThan(
        repo.deleteOldReadNotifications.mock.invocationCallOrder[0],
      );
    });

    it('releases the lease even if a delete throws', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        new Error('connection lost'),
      );

      await service.sweep();

      // Lease must be released even though the sweep failed
      expect(repo.releaseLease).toHaveBeenCalledWith(
        'boffmedia_retention_sweep',
        'lease-token-123',
      );
    });

    it('logs an error if lease release itself fails', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        new Error('timeout'),
      );
      repo.releaseLease.mockRejectedValueOnce(new Error('connection lost'));

      await service.sweep();

      // Should log both the sweep failure and the release failure
      expect(logger.error).toHaveBeenCalledTimes(2);
      expect(logger.error.mock.calls[1][0]).toContain('lease release failed');
    });

    it('never skips lease release via try/catch rethrow', async () => {
      // Even if the error handler rethrows, the finally must run.
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        new Error('any error'),
      );

      // The service catches errors, so it doesn't rethrow.
      await service.sweep();

      // Still must release the lease.
      expect(repo.releaseLease).toHaveBeenCalled();
    });
  });

  describe('sweep operations', () => {
    beforeEach(() => {
      // Reset all env values to enabled
      mockEnv.RETENTION_NOTIFICATIONS_DAYS = 30;
      mockEnv.RETENTION_AUDIT_MONTHS = 12;
      mockEnv.RETENTION_GOBIERNO_AUDIT_MONTHS = 12;
      mockEnv.RETENTION_OUTBOX_DAYS = 7;
      mockEnv.RETENTION_EVENT_INVITES_GRACE_DAYS = 7;
      mockEnv.RETENTION_NOTE_VERSIONS_KEEP = 50;
      mockEnv.RETENTION_DELETED_USER_DAYS = 30;
    });

    it('runs all delete operations when their windows are enabled', async () => {
      repo.deleteOldReadNotifications.mockResolvedValueOnce(5);
      repo.deleteBoffMediaAuditOld.mockResolvedValueOnce(10);
      repo.deletePackAuditOld.mockResolvedValueOnce(3);
      repo.deleteRandomizerAuditOld.mockResolvedValueOnce(2);
      repo.deleteGobiernoAuditoriaOld.mockResolvedValueOnce(1);
      repo.deleteDeliveredOutbox.mockResolvedValueOnce(7);
      repo.deleteExpiredEventInvites.mockResolvedValueOnce(4);
      repo.deleteOldNoteVersions.mockResolvedValueOnce(15);
      dataExport.purgeExpired.mockResolvedValueOnce(2);
      erasure.sweep.mockResolvedValueOnce(1);

      await service.sweep();

      expect(repo.deleteOldReadNotifications).toHaveBeenCalled();
      expect(repo.deleteBoffMediaAuditOld).toHaveBeenCalled();
      expect(repo.deletePackAuditOld).toHaveBeenCalled();
      expect(repo.deleteRandomizerAuditOld).toHaveBeenCalled();
      expect(repo.deleteGobiernoAuditoriaOld).toHaveBeenCalled();
      expect(repo.deleteDeliveredOutbox).toHaveBeenCalled();
      expect(repo.deleteExpiredEventInvites).toHaveBeenCalled();
      expect(repo.deleteOldNoteVersions).toHaveBeenCalled();
      expect(dataExport.purgeExpired).toHaveBeenCalled();
      expect(erasure.sweep).toHaveBeenCalled();
    });

    it('skips delete operations whose windows are disabled (0)', async () => {
      mockEnv.RETENTION_NOTIFICATIONS_DAYS = 0;

      await service.sweep();

      expect(repo.deleteOldReadNotifications).not.toHaveBeenCalled();
    });

    it('logs a summary of deleted rows', async () => {
      repo.deleteOldReadNotifications.mockResolvedValueOnce(5);
      repo.deleteBoffMediaAuditOld.mockResolvedValueOnce(10);

      await service.sweep();

      // Should log BOTH operations in one summary call
      const calls = (logger as any).info.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const summary = calls[0][0];
      expect(summary).toContain('notifications: -5');
      expect(summary).toContain('boffmedia_audit: -10');
    });

    it('does not log if no rows were deleted', async () => {
      await service.sweep();

      expect((logger as any).info).not.toHaveBeenCalled();
    });
  });

  describe('failure handling and metrics', () => {
    beforeEach(() => {
      // Ensure env values are set so the delete operations run
      mockEnv.RETENTION_NOTIFICATIONS_DAYS = 30;
    });

    it('catches sweep failures and logs them with error type', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        new Error('connection lost'),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[connection_lost]'),
      );
    });

    it('categorizes connection errors', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        Object.assign(new Error('ECONNREFUSED'), { code: 'ECONNREFUSED' }),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[connection_lost]'),
      );
    });

    it('categorizes timeout errors', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        Object.assign(new Error('query timeout'), {
          code: 'PROTOCOL_SEQUENCE_TIMEOUT',
        }),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[timeout]'),
      );
    });

    it('categorizes schema mismatch errors', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        Object.assign(new Error('ER_NO_SUCH_TABLE'), {
          code: 'ER_NO_SUCH_TABLE',
        }),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[schema_mismatch]'),
      );
    });

    it('categorizes deadlock errors', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        Object.assign(new Error('Deadlock found'), {
          code: 'ER_LOCK_DEADLOCK',
        }),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[deadlock]'),
      );
    });

    it('defaults unknown errors to "unknown" category', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce(
        new Error('some weird error'),
      );

      await service.sweep();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[unknown]'),
      );
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      // Ensure env values are set so operations run
      mockEnv.RETENTION_AUDIT_MONTHS = 12;
      mockEnv.RETENTION_NOTIFICATIONS_DAYS = 30;
    });

    it('runs erasure last, after all other deletes', async () => {
      repo.deleteBoffMediaAuditOld.mockResolvedValueOnce(1);

      await service.sweep();

      const auditCallOrder =
        repo.deleteBoffMediaAuditOld.mock.invocationCallOrder[0];
      const erasureCallOrder = erasure.sweep.mock.invocationCallOrder[0];

      expect(erasureCallOrder).toBeGreaterThan(auditCallOrder);
    });

    it('is resilient to null error messages', async () => {
      repo.deleteOldReadNotifications.mockRejectedValueOnce({});

      await service.sweep();

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
