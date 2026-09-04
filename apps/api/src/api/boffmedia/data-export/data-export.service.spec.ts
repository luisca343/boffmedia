import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';

import { OutboxRepository } from '@api/outbox/repositories/outbox.repository';
import { EXPORT_STATUS } from '@/_db/schema/BoffMediaDataExports';

import { DataExportService, DATA_EXPORT_TOPIC } from './data-export.service';
import { DataExportRepository } from './repositories/data-export.repository';

const mockEnv = {
  DATA_EXPORT_COOLDOWN_HOURS: 24,
  DATA_EXPORT_TTL_DAYS: 7,
};
jest.mock('@/config/env', () => ({
  get env() {
    return mockEnv;
  },
}));

const HOUR_MS = 60 * 60 * 1000;

const row = (over: Record<string, unknown> = {}) => ({
  id: 5,
  userId: 1,
  status: EXPORT_STATUS.READY,
  filename: 'boffmedia-export-1-5-abc.json',
  sizeBytes: 1234,
  lastError: null,
  requestedAt: new Date(Date.now() - 48 * HOUR_MS),
  completedAt: new Date(),
  expiresAt: new Date(Date.now() + 24 * HOUR_MS),
  ...over,
});

describe('DataExportService', () => {
  let service: DataExportService;
  let repo: jest.Mocked<DataExportRepository>;
  let outbox: jest.Mocked<OutboxRepository>;

  beforeEach(async () => {
    mockEnv.DATA_EXPORT_COOLDOWN_HOURS = 24;

    repo = {
      findLatestForUser: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockResolvedValue(row()),
      create: jest.fn().mockResolvedValue(5),
      markReady: jest.fn(),
      markFailed: jest.fn(),
      findExpired: jest.fn().mockResolvedValue([]),
      filenamesForUser: jest.fn().mockResolvedValue([]),
      markExpired: jest.fn(),
      resolveSubject: jest.fn(),
      collect: jest.fn(),
    } as unknown as jest.Mocked<DataExportRepository>;

    outbox = {
      enqueue: jest.fn().mockResolvedValue(1),
    } as unknown as jest.Mocked<OutboxRepository>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataExportService,
        { provide: DataExportRepository, useValue: repo },
        { provide: OutboxRepository, useValue: outbox },
        {
          provide: Logger,
          useValue: { log: jest.fn(), warn: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(DataExportService);
  });

  describe('requesting an export', () => {
    it('queues the build instead of doing it in the request', async () => {
      await service.request(1);

      // The build reads ~90 tables. Inside the POST it is a request the proxy
      // cuts and the user retries, each retry starting another one.
      expect(outbox.enqueue).toHaveBeenCalledWith(DATA_EXPORT_TOPIC, {
        exportId: 5,
        userId: 1,
      });
    });

    it('hands back the pending row instead of queueing a second build', async () => {
      const pending = row({ status: EXPORT_STATUS.PENDING });
      repo.findLatestForUser.mockResolvedValue(pending);

      expect(await service.request(1)).toBe(pending);
      expect(repo.create).not.toHaveBeenCalled();
      expect(outbox.enqueue).not.toHaveBeenCalled();
    });

    describe('the cooldown boundary', () => {
      it('refuses one millisecond inside the window', async () => {
        repo.findLatestForUser.mockResolvedValue(
          row({ requestedAt: new Date(Date.now() - (24 * HOUR_MS - 1)) }),
        );

        await expect(service.request(1)).rejects.toBeInstanceOf(
          BadRequestException,
        );
        expect(repo.create).not.toHaveBeenCalled();
      });

      it('allows one millisecond outside it', async () => {
        repo.findLatestForUser.mockResolvedValue(
          row({ requestedAt: new Date(Date.now() - (24 * HOUR_MS + 1)) }),
        );

        await expect(service.request(1)).resolves.toBeDefined();
        expect(repo.create).toHaveBeenCalled();
      });

      it('does not charge the cooldown for an attempt that failed', async () => {
        // The user got nothing, so making them wait a day for a second try is
        // punishing them for our bug.
        repo.findLatestForUser.mockResolvedValue(
          row({
            status: EXPORT_STATUS.FAILED,
            requestedAt: new Date(Date.now() - 60_000),
          }),
        );

        await expect(service.request(1)).resolves.toBeDefined();
      });

      it('is disabled by setting the window to 0', async () => {
        mockEnv.DATA_EXPORT_COOLDOWN_HOURS = 0;
        repo.findLatestForUser.mockResolvedValue(
          row({ requestedAt: new Date() }),
        );

        await expect(service.request(1)).resolves.toBeDefined();
      });
    });
  });

  describe('downloading', () => {
    it("refuses somebody else's export before it touches the disk", async () => {
      repo.findById.mockResolvedValue(row({ userId: 2 }));

      // Owner only — not owner-or-admin. This file is the densest pile of one
      // person's data the system can produce, and an admin already has the
      // database.
      await expect(service.open(1, 5)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('refuses an export that is still being built', async () => {
      repo.findById.mockResolvedValue(
        row({ status: EXPORT_STATUS.PENDING, filename: null }),
      );

      await expect(service.open(1, 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('refuses an export past its expiry, even if the file is still there', async () => {
      repo.findById.mockResolvedValue(
        row({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.open(1, 5)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('purging', () => {
    it('unlinks the file before it forgets the filename', async () => {
      repo.findExpired.mockResolvedValue([row({ id: 5 })]);

      const purged = await service.purgeExpired(new Date());

      expect(purged).toBe(1);
      // The other order leaves an archive of somebody's whole account on disk
      // with nothing pointing at it — which is how a store of everyone's
      // personal data accumulates quietly forever.
      expect(repo.markExpired).toHaveBeenCalledWith(5);
      expect(repo.findExpired.mock.invocationCallOrder[0]).toBeLessThan(
        repo.markExpired.mock.invocationCallOrder[0],
      );
    });
  });
});
