import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { EventsService } from './events.service';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { RANDOMIZER_RUNNER_TOKEN } from '../ports/randomizer-runner.port';
import {
  SETTINGS_SHIM_TOKEN,
  ISettingsShim,
} from '../ports/settings-shim.port';
import { createHash } from 'crypto';
import { Readable } from 'stream';

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<RandomizerRepository>;
  let blobStorage: jest.Mocked<PacksDownloadsService>;
  let settingsShim: jest.Mocked<ISettingsShim>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Mock repository
    repository = {
      getPresetById: jest.fn(),
      listPresets: jest.fn(),
      createConfigAndAttachPack: jest.fn(),
      getConfigById: jest.fn(),
      getEventPackAndStatus: jest.fn().mockResolvedValue(null),
      getEmulatorPack: jest.fn(),
      findEventHoldingPack: jest.fn(),
      getRomById: jest.fn(),
      getPublishedEmulatorRom: jest
        .fn()
        .mockResolvedValue({ state: 'no-version' }),
    } as unknown as jest.Mocked<RandomizerRepository>;

    // Mock blob storage
    blobStorage = {
      storeBlob: jest.fn(),
      override: jest.fn(),
      blobSize: jest.fn(),
    } as unknown as jest.Mocked<PacksDownloadsService>;

    // Mock settings shim
    settingsShim = {
      encode: jest.fn(),
    } as unknown as jest.Mocked<ISettingsShim>;

    // Mock config service
    configService = {
      get: jest.fn((key) => {
        if (key === 'env') {
          return { RANDOMIZER_JAR: '/path/to/jar' };
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    // Mock logger
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: RANDOMIZER_REPOSITORY_TOKEN,
          useValue: repository,
        },
        {
          provide: PacksDownloadsService,
          useValue: blobStorage,
        },
        {
          provide: SETTINGS_SHIM_TOKEN,
          useValue: settingsShim,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
        {
          provide: Logger,
          useValue: logger,
        },
        {
          provide: RANDOMIZER_RUNNER_TOKEN,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe('createConfig', () => {
    beforeEach(() => {
      // Mock getFvxJarSha512 to avoid reading actual jar file
      jest
        .spyOn(service as any, 'getFvxJarSha512')
        .mockReturnValue('jarsha512hash');
      // The config now pins a library ROM: resolve one and confirm its blob is on disk.
      repository.getRomById.mockResolvedValue({
        id: 7,
        name: 'FireRed',
        gamePlatform: 'gba',
        sha512: 'r'.repeat(128),
        fileSize: 1000,
      } as any);
      blobStorage.blobSize.mockResolvedValue(1000);
    });

    it('persists settings blob and uses returned hash', async () => {
      const preset = {
        id: 1,
        settingsJson: { foo: 'bar' },
      };

      const settingsJson = JSON.stringify(preset.settingsJson);
      const expectedSha512 = createHash('sha512')
        .update(settingsJson)
        .digest('hex');

      repository.getPresetById.mockResolvedValue(preset as any);
      repository.getEmulatorPack.mockResolvedValue({
        id: 'pack1',
        name: 'Pack 1',
      });
      repository.findEventHoldingPack.mockResolvedValue(null);
      blobStorage.storeBlob.mockResolvedValue({
        sha512: expectedSha512,
        size: settingsJson.length,
      });
      repository.createConfigAndAttachPack.mockResolvedValue(1);
      repository.getConfigById.mockResolvedValue({
        id: 1,
        eventId: 1,
        settingsBlobSha512: expectedSha512,
        status: 'draft',
      } as any);

      const result = await service.createConfig({
        eventId: 1,
        gamePlatform: 'gba',
        gameTitle: 'Pokemon Red',
        presetId: 1,
        romId: 7,
        packId: 'pack1',
      });

      expect(blobStorage.storeBlob).toHaveBeenCalled();
      expect(result.settingsBlobSha512).toBe(expectedSha512);
      expect(repository.createConfigAndAttachPack).toHaveBeenCalledWith(
        expect.objectContaining({
          settingsBlobSha512: expectedSha512,
        }),
        'pack1',
      );
    });

    it('throws error if blob hash does not match computed hash', async () => {
      const preset = {
        id: 1,
        settingsJson: { foo: 'bar' },
      };

      repository.getPresetById.mockResolvedValue(preset as any);
      repository.getEmulatorPack.mockResolvedValue({
        id: 'pack1',
        name: 'Pack 1',
      });
      repository.findEventHoldingPack.mockResolvedValue(null);
      blobStorage.storeBlob.mockResolvedValue({
        sha512:
          'wronghash123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        size: 100,
      });

      await expect(
        service.createConfig({
          eventId: 1,
          gamePlatform: 'gba',
          gameTitle: 'Pokemon Red',
          presetId: 1,
          romId: 7,
          packId: 'pack1',
        }),
      ).rejects.toThrow('Settings blob hash mismatch');
    });
  });

  describe('settingsJsonBytesForConfig', () => {
    it('reads blob from disk if it exists', async () => {
      const settingsJson = JSON.stringify({ foo: 'bar' });
      const config = {
        id: 1,
        settingsBlobSha512: createHash('sha512')
          .update(settingsJson)
          .digest('hex'),
      };

      const mockStream = Readable.from([Buffer.from(settingsJson)]);
      blobStorage.override.mockResolvedValue({ stream: mockStream } as any);

      const result = await service.settingsJsonBytesForConfig(config as any);

      expect(result.toString('utf-8')).toBe(settingsJson);
      expect(blobStorage.override).toHaveBeenCalledWith(
        config.settingsBlobSha512,
      );
    });

    it('heals blob if missing but preset matches', async () => {
      const settingsJson = JSON.stringify({ foo: 'bar' });
      const sha512 = createHash('sha512').update(settingsJson).digest('hex');

      const config = {
        id: 1,
        settingsBlobSha512: sha512,
      };

      const preset = {
        id: 1,
        settingsJson: { foo: 'bar' },
      };

      // First call to override throws (blob not found)
      blobStorage.override.mockRejectedValueOnce(new Error('Not found'));

      // Preset scan
      repository.listPresets.mockResolvedValue([preset] as any);

      // storeBlob called during heal
      blobStorage.storeBlob.mockResolvedValue({
        sha512,
        size: settingsJson.length,
      });

      const result = await service.settingsJsonBytesForConfig(config as any);

      expect(result.toString('utf-8')).toBe(settingsJson);
      expect(blobStorage.storeBlob).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        expect.stringContaining('Found matching preset'),
      );
    });

    it('throws 409 if blob missing and no preset matches', async () => {
      const sha512 =
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

      const config = {
        id: 1,
        settingsBlobSha512: sha512,
      };

      // Blob not found
      blobStorage.override.mockRejectedValueOnce(new Error('Not found'));

      // No matching presets
      repository.listPresets.mockResolvedValue([
        {
          id: 1,
          settingsJson: { different: 'settings' },
        },
      ] as any);

      await expect(
        service.settingsJsonBytesForConfig(config as any),
      ).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException if config has no settingsBlobSha512', async () => {
      const config = {
        id: 1,
        settingsBlobSha512: null,
      };

      await expect(
        service.settingsJsonBytesForConfig(config as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('openConfig()', () => {
    const draftConfig = {
      id: 7,
      eventId: 12,
      status: 'draft',
      romId: 3,
      cleanRomSha512: 'r'.repeat(128),
    };

    beforeEach(() => {
      jest.spyOn(service, 'getConfig').mockResolvedValue(draftConfig as never);
      repository.updateConfig = jest.fn();
      repository.appendAudit = jest.fn();
      // Opening requires a published version whose emulator ROM matches the
      // pinned clean ROM.
      repository.getPublishedEmulatorRom.mockResolvedValue({
        state: 'ok',
        versionId: 'v1',
        romPath: 'roms/clean.gba',
        sha512: 'r'.repeat(128),
      });
    });

    it('refuses to open when the event is not active', async () => {
      // The randomizer consumes the event lifecycle, it does not drive it.
      // Flipping the event to active from here leaves an event with no
      // randomizer config unable to go live at all.
      repository.getEventPackAndStatus.mockResolvedValue({
        packId: 'pack1',
        status: 'upcoming',
      });

      await expect(service.openConfig(7)).rejects.toThrow(ConflictException);
      expect(repository.updateConfig).not.toHaveBeenCalled();
    });

    it('opens when the event is already active', async () => {
      repository.getEventPackAndStatus.mockResolvedValue({
        packId: 'pack1',
        status: 'active',
      });

      await service.openConfig(7);

      expect(repository.updateConfig).toHaveBeenCalledWith(7, {
        status: 'open',
      });
    });

    it('refuses to open when the event has no pack attached', async () => {
      repository.getEventPackAndStatus.mockResolvedValue({
        packId: null,
        status: 'active',
      });

      await expect(service.openConfig(7)).rejects.toThrow(ConflictException);
    });

    it('refuses to open when the published ROM differs from the pinned clean ROM', async () => {
      repository.getEventPackAndStatus.mockResolvedValue({
        packId: 'pack1',
        status: 'active',
      });
      repository.getPublishedEmulatorRom.mockResolvedValue({
        state: 'ok',
        versionId: 'v1',
        romPath: 'roms/clean.gba',
        sha512: 'f'.repeat(128),
      });

      await expect(service.openConfig(7)).rejects.toThrow(ConflictException);
      expect(repository.updateConfig).not.toHaveBeenCalled();
    });

    it('refuses to open when the pack has no published version', async () => {
      repository.getEventPackAndStatus.mockResolvedValue({
        packId: 'pack1',
        status: 'active',
      });
      repository.getPublishedEmulatorRom.mockResolvedValue({
        state: 'no-version',
      });

      await expect(service.openConfig(7)).rejects.toThrow(ConflictException);
      expect(repository.updateConfig).not.toHaveBeenCalled();
    });
  });
});
