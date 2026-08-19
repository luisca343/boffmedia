import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { RomsService } from './roms.service';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import { Logger } from 'nestjs-pino';

describe('RomsService', () => {
  let service: RomsService;
  let repository: jest.Mocked<RandomizerRepository>;
  let blobStorage: jest.Mocked<PacksDownloadsService>;

  const SHA = 'a'.repeat(128);

  beforeEach(async () => {
    repository = {
      getRomBySha512: jest.fn(),
      getRomById: jest.fn(),
      createRom: jest.fn(),
      listRomsWithRefCount: jest.fn(),
      countConfigsReferencingRom: jest.fn(),
      deleteRom: jest.fn(),
    } as unknown as jest.Mocked<RandomizerRepository>;

    blobStorage = {
      storeBlob: jest.fn(),
    } as unknown as jest.Mocked<PacksDownloadsService>;

    const logger = { debug: jest.fn(), error: jest.fn() } as unknown as Logger;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RomsService,
        { provide: RANDOMIZER_REPOSITORY_TOKEN, useValue: repository },
        { provide: PacksDownloadsService, useValue: blobStorage },
        { provide: Logger, useValue: logger },
      ],
    }).compile();

    service = module.get<RomsService>(RomsService);
  });

  describe('uploadRom', () => {
    it('stores the blob and inserts a library row', async () => {
      blobStorage.storeBlob.mockResolvedValue({ sha512: SHA, size: 1000 });
      repository.getRomBySha512.mockResolvedValue(null);
      repository.createRom.mockResolvedValue(5);
      repository.getRomById.mockResolvedValue({
        id: 5,
        name: 'FireRed',
        gamePlatform: 'gba',
        sha512: SHA,
        fileSize: 1000,
      } as any);

      const rom = await service.uploadRom({
        name: 'FireRed',
        gamePlatform: 'gba',
        romBuffer: Buffer.from('rom bytes'),
      });

      expect(blobStorage.storeBlob).toHaveBeenCalled();
      expect(repository.createRom).toHaveBeenCalledWith(
        expect.objectContaining({
          sha512: SHA,
          gamePlatform: 'gba',
          fileSize: 1000,
        }),
      );
      expect(rom.id).toBe(5);
    });

    it('rejects a duplicate sha512', async () => {
      blobStorage.storeBlob.mockResolvedValue({ sha512: SHA, size: 1000 });
      repository.getRomBySha512.mockResolvedValue({
        id: 3,
        name: 'existing',
        sha512: SHA,
      } as any);

      await expect(
        service.uploadRom({
          name: 'dupe',
          gamePlatform: 'gba',
          romBuffer: Buffer.from('rom bytes'),
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(repository.createRom).not.toHaveBeenCalled();
    });

    it('rejects an invalid platform', async () => {
      await expect(
        service.uploadRom({
          name: 'x',
          gamePlatform: 'snes',
          romBuffer: Buffer.from('rom'),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('deleteRom', () => {
    it('deletes when unreferenced', async () => {
      repository.getRomById.mockResolvedValue({ id: 5, sha512: SHA } as any);
      repository.countConfigsReferencingRom.mockResolvedValue(0);

      await service.deleteRom(5);

      expect(repository.deleteRom).toHaveBeenCalledWith(5);
    });

    it('409s when referenced by a config', async () => {
      repository.getRomById.mockResolvedValue({ id: 5, sha512: SHA } as any);
      repository.countConfigsReferencingRom.mockResolvedValue(2);

      await expect(service.deleteRom(5)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repository.deleteRom).not.toHaveBeenCalled();
    });
  });
});
