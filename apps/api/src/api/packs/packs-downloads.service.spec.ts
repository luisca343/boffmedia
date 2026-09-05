import { createHash } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';
import {
  ServiceUnavailableException,
  PayloadTooLargeException,
} from '@nestjs/common';

import { env } from '@/config/env';
import { PacksDownloadsService } from './packs-downloads.service';
import { UploadsRepository } from '@api/_repositories/boffmedia/uploads.repository';

// Mock fs/promises for A17 tests (statfs)
jest.mock('fs/promises', () => ({
  ...jest.requireActual('fs/promises'),
  statfs: jest.fn(),
}));

// The blob store is the half of the download path with no database behind it:
// if the name on disk is not a true digest of the bytes, every launcher fails
// verification and there is nothing in MySQL that would reveal why.
describe('PacksDownloadsService — override blobs', () => {
  let service: PacksDownloadsService;
  let dir: string;
  let previous: string | undefined;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pack-blobs-'));
    previous = env.PACK_BLOB_DIR;
    (env as { PACK_BLOB_DIR?: string }).PACK_BLOB_DIR = dir;
  });

  afterAll(async () => {
    (env as { PACK_BLOB_DIR?: string }).PACK_BLOB_DIR = previous;
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(() => {
    // Create service with mock dependencies for each test
    const mockUploadsRepository = {
      getDailyUploadSizeBytes: jest.fn().mockResolvedValue(0),
    } as any;
    service = new PacksDownloadsService({} as never, mockUploadsRepository);

    // Setup default mock for statfs (plenty of space)
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Access mocked fs/promises for testing
    const mockStatfs = require('fs/promises').statfs as jest.Mock;
    mockStatfs.mockResolvedValue({
      bavail: 100 * 1024 * 1024,
      bsize: 1024,
    } as any);
  });

  it('names the blob after a hash of the bytes it actually received', async () => {
    const bytes = Buffer.from('options:txt\nfov:1.0\n');
    const { sha512, size } = await service.storeBlob(Readable.from([bytes]));

    expect(sha512).toBe(createHash('sha512').update(bytes).digest('hex'));
    expect(size).toBe(bytes.length);
    await expect(service.blobSize(sha512)).resolves.toBe(bytes.length);
  });

  it('is idempotent: re-uploading the same bytes is not an error', async () => {
    const bytes = Buffer.from('same bytes');
    const first = await service.storeBlob(Readable.from([bytes]));
    const second = await service.storeBlob(Readable.from([bytes]));
    expect(second).toEqual(first);
  });

  it('rejects an empty body rather than storing the hash of nothing', async () => {
    await expect(service.storeBlob(Readable.from([]))).rejects.toThrow();
  });

  it('reports an unknown blob as absent, and never treats a bad hash as a path', async () => {
    await expect(service.blobSize('a'.repeat(128))).resolves.toBeNull();
    await expect(service.blobSize('../../etc/passwd')).resolves.toBeNull();
  });
});

// ─── A17: Per-user daily quota and free-space checks (behavioral tests) ────────
describe('PacksDownloadsService — A17 behavioral tests', () => {
  let service: PacksDownloadsService;
  let dir: string;
  let previous: string | undefined;
  let mockUploadsRepository: jest.Mocked<UploadsRepository>;
  let mockHttpService: any;
  let mockStatfs: jest.Mock;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'pack-blobs-a17-behavior-'));
    previous = env.PACK_BLOB_DIR;
    (env as { PACK_BLOB_DIR?: string }).PACK_BLOB_DIR = dir;

    // Get reference to mocked statfs
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- Access mocked fs/promises for testing
    mockStatfs = require('fs/promises').statfs as jest.Mock;
  });

  afterAll(async () => {
    (env as { PACK_BLOB_DIR?: string }).PACK_BLOB_DIR = previous;
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockUploadsRepository = {
      getDailyUploadSizeBytes: jest.fn(),
    } as any;

    mockHttpService = {};
    service = new PacksDownloadsService(mockHttpService, mockUploadsRepository);

    // Default: plenty of free space
    mockStatfs.mockResolvedValue({
      bavail: 100 * 1024 * 1024,
      bsize: 1024,
    } as any);
  });

  describe('daily quota enforcement', () => {
    it('rejects when daily total already at quota (userId provided)', async () => {
      const dailyQuotaMB = env.UPLOAD_DAILY_QUOTA_MB;
      const dailyQuotaBytes = dailyQuotaMB * 1024 * 1024;

      // User has used exactly the full quota
      mockUploadsRepository.getDailyUploadSizeBytes.mockResolvedValue(
        dailyQuotaBytes,
      );

      const bytes = Buffer.from('test');
      await expect(
        service.storeBlob(Readable.from([bytes]), 1),
      ).rejects.toThrow(PayloadTooLargeException);

      expect(
        mockUploadsRepository.getDailyUploadSizeBytes,
      ).toHaveBeenCalledWith(1);
    });

    it('allows upload when daily total is under quota', async () => {
      const dailyQuotaMB = env.UPLOAD_DAILY_QUOTA_MB;
      const dailyQuotaBytes = dailyQuotaMB * 1024 * 1024;

      // User has used only 10% of quota
      mockUploadsRepository.getDailyUploadSizeBytes.mockResolvedValue(
        Math.floor(dailyQuotaBytes * 0.1),
      );

      const bytes = Buffer.from('test data');
      const result = await service.storeBlob(Readable.from([bytes]), 1);

      expect(result).toHaveProperty('sha512');
      expect(result.size).toBe(bytes.length);
      expect(
        mockUploadsRepository.getDailyUploadSizeBytes,
      ).toHaveBeenCalledWith(1);
    });
  });

  describe('free disk space enforcement', () => {
    it('rejects when free disk space is below threshold', async () => {
      // Mock statfs to return less than minimum free space
      mockStatfs.mockResolvedValue({
        bavail: 1,
        bsize: 1024, // Only 1KB free, way below 10GB threshold
      } as any);

      const bytes = Buffer.from('test');
      await expect(
        service.storeBlob(Readable.from([bytes]), 1),
      ).rejects.toThrow(ServiceUnavailableException);

      // Should not query quota if free-space check fails first
      expect(
        mockUploadsRepository.getDailyUploadSizeBytes,
      ).not.toHaveBeenCalled();
    });

    it('rejects when free-space probe throws (deliberate: no silent bypass)', async () => {
      // Mock statfs to throw (e.g., permission error on disk)
      mockStatfs.mockRejectedValue(new Error('EACCES: permission denied'));

      const bytes = Buffer.from('test');
      await expect(
        service.storeBlob(Readable.from([bytes]), 1),
      ).rejects.toThrow(ServiceUnavailableException);

      // CRITICAL: Disk probe failure must reject, not silently proceed
      // This is a deliberate design decision: a broken disk probe takes uploads down
      expect(
        mockUploadsRepository.getDailyUploadSizeBytes,
      ).not.toHaveBeenCalled();
    });
  });
});
