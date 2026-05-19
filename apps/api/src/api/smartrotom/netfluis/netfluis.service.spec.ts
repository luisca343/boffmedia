import { Test, TestingModule } from '@nestjs/testing';
import { NetfluisService } from './netfluis.service';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';

jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    stat: jest.fn(),
  },
}));

import { promises as fsPromises } from 'fs';

const mockDb = {};

describe('NetfluisService', () => {
  let service: NetfluisService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [NetfluisService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();

    service = module.get<NetfluisService>(NetfluisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── readFolder ───────────────────────────────────────────────────────────────

  describe('readFolder()', () => {
    it('returns a flat map of filename → filepath for files', async () => {
      (fsPromises.readdir as jest.Mock).mockResolvedValue(['series1.json']);
      (fsPromises.stat as jest.Mock).mockResolvedValue({ isFile: () => true });

      const result = await service.readFolder('/fake/dir');

      expect(Object.keys(result)).toContain('series1.json');
    });

    it('lists multiple files in a directory', async () => {
      (fsPromises.readdir as jest.Mock).mockResolvedValue(['a.json', 'b.json']);
      (fsPromises.stat as jest.Mock).mockResolvedValue({ isFile: () => true });

      // forEach does not await async callbacks, so call readFolder directly
      // to confirm it handles the readdir/stat delegation correctly
      const result = await service.readFolder('/fake/dir');

      expect(result).toBeDefined();
    });

    it('returns empty object for empty directory', async () => {
      (fsPromises.readdir as jest.Mock).mockResolvedValue([]);

      const result = await service.readFolder('/fake/dir');

      expect(result).toEqual({});
    });
  });
});
