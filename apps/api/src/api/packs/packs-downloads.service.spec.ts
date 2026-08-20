import { createHash } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

import { env } from '@/config/env';
import { PacksDownloadsService } from './packs-downloads.service';

// The blob store is the half of the download path with no database behind it:
// if the name on disk is not a true digest of the bytes, every launcher fails
// verification and there is nothing in MySQL that would reveal why.
describe('PacksDownloadsService — override blobs', () => {
  const service = new PacksDownloadsService({} as never);
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
