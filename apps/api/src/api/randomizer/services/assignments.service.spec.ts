import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { EventsService } from './events.service';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import { Logger } from 'nestjs-pino';
import { RANDOMIZER_RUNNER_TOKEN, IRandomizerRunner } from '../ports/randomizer-runner.port';
import { SETTINGS_SHIM_TOKEN, ISettingsShim } from '../ports/settings-shim.port';
import { createHash } from 'crypto';
import { Readable } from 'stream';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let repository: jest.Mocked<RandomizerRepository>;
  let blobStorage: jest.Mocked<PacksDownloadsService>;
  let eventsService: jest.Mocked<EventsService>;
  let settingsShim: jest.Mocked<ISettingsShim>;
  let runner: jest.Mocked<IRandomizerRunner>;
  let logger: jest.Mocked<Logger>;

  beforeEach(async () => {
    // Mock repository
    repository = {
      getConfigById: jest.fn(),
      getAssignmentByConfigAndMcUuid: jest.fn(),
      appendAudit: jest.fn(),
      updateAssignment: jest.fn(),
    } as unknown as jest.Mocked<RandomizerRepository>;

    // Mock blob storage
    blobStorage = {
      storeBlob: jest.fn(),
      override: jest.fn(),
    } as unknown as jest.Mocked<PacksDownloadsService>;

    // Mock events service
    eventsService = {
      settingsJsonBytesForConfig: jest.fn(),
    } as unknown as jest.Mocked<EventsService>;

    // Mock settings shim
    settingsShim = {
      encode: jest.fn(),
    } as unknown as jest.Mocked<ISettingsShim>;

    // Mock runner
    runner = {
      randomize: jest.fn(),
    } as unknown as jest.Mocked<IRandomizerRunner>;

    // Mock logger
    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        {
          provide: RANDOMIZER_REPOSITORY_TOKEN,
          useValue: repository,
        },
        {
          provide: PacksDownloadsService,
          useValue: blobStorage,
        },
        {
          provide: EventsService,
          useValue: eventsService,
        },
        {
          provide: SETTINGS_SHIM_TOKEN,
          useValue: settingsShim,
        },
        {
          provide: RANDOMIZER_RUNNER_TOKEN,
          useValue: runner,
        },
        {
          provide: Logger,
          useValue: logger,
        },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  describe('patchRom', () => {
    it('encodes settings via shim and calls runner with encoded .rnqs', async () => {
      const settingsJson = { foo: 'bar' };
      const settingsJsonBytes = Buffer.from(JSON.stringify(settingsJson));
      const encodedRnqs = Buffer.from('encoded rnqs data');

      const config = {
        id: 1,
        eventId: 1,
        settingsBlobSha512: 'sha512hash',
        gamePlatform: 'gba',
        fvxJarSha512: 'jarsha512',
        cleanRomSha512: createHash('sha512').update('rom content').digest('hex'),
      };

      const assignment = {
        id: 1,
        configId: 1,
        seed: 12345,
      };

      const principal = { uuid: 'player-uuid' };

      const romBuffer = Buffer.from('rom content');

      repository.getConfigById.mockResolvedValue(config as any);
      repository.getAssignmentByConfigAndMcUuid.mockResolvedValue(assignment as any);
      eventsService.settingsJsonBytesForConfig.mockResolvedValue(settingsJsonBytes);
      settingsShim.encode.mockResolvedValue(encodedRnqs);
      runner.randomize.mockResolvedValue({
        romBytes: Buffer.from('randomized rom'),
        outputSha512: 'output sha512',
        logBytes: Buffer.from('log data'),
      } as any);
      blobStorage.storeBlob.mockResolvedValue({ sha512: 'logblobsha512', size: 8 });

      const romStream = Readable.from([romBuffer]);

      const result = await service.patchRom(1, principal as any, romStream);

      // Verify settingsShim.encode was called with parsed settings
      expect(settingsShim.encode).toHaveBeenCalledWith(settingsJson);

      // Verify runner was called with encoded .rnqs
      expect(runner.randomize).toHaveBeenCalledWith(
        expect.objectContaining({
          settingsRnqs: encodedRnqs,
          seed: 12345,
        }),
      );

      // Verify assignment was updated with output and log
      expect(repository.updateAssignment).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          outputSha512: 'output sha512',
          logBlobSha512: 'logblobsha512',
          status: 'patched',
        }),
      );
    });

    it('handles heal case: blob missing but preset matches', async () => {
      const settingsJson = { foo: 'bar' };
      const settingsJsonBytes = Buffer.from(JSON.stringify(settingsJson));
      const encodedRnqs = Buffer.from('encoded rnqs data');

      const config = {
        id: 1,
        eventId: 1,
        settingsBlobSha512: 'sha512hash',
        gamePlatform: 'gba',
        fvxJarSha512: 'jarsha512',
        cleanRomSha512: createHash('sha512').update('rom content').digest('hex'),
      };

      const assignment = {
        id: 1,
        configId: 1,
        seed: 12345,
      };

      const principal = { uuid: 'player-uuid' };
      const romBuffer = Buffer.from('rom content');

      repository.getConfigById.mockResolvedValue(config as any);
      repository.getAssignmentByConfigAndMcUuid.mockResolvedValue(assignment as any);
      // eventsService handles the heal internally
      eventsService.settingsJsonBytesForConfig.mockResolvedValue(settingsJsonBytes);
      settingsShim.encode.mockResolvedValue(encodedRnqs);
      runner.randomize.mockResolvedValue({
        romBytes: Buffer.from('randomized rom'),
        outputSha512: 'output sha512',
        logBytes: Buffer.from('log data'),
      } as any);
      blobStorage.storeBlob.mockResolvedValue({ sha512: 'logblobsha512', size: 8 });

      const romStream = Readable.from([romBuffer]);

      const result = await service.patchRom(1, principal as any, romStream);

      // Verify settings were fetched (heal happens internally in eventsService)
      expect(eventsService.settingsJsonBytesForConfig).toHaveBeenCalledWith(config);

      // Verify runner was called with encoded .rnqs
      expect(runner.randomize).toHaveBeenCalledWith(
        expect.objectContaining({
          settingsRnqs: encodedRnqs,
        }),
      );
    });

    it('throws 409 if blob missing and no preset matches', async () => {
      const config = {
        id: 1,
        eventId: 1,
        settingsBlobSha512: 'nonmatchingsha512hash',
        gamePlatform: 'gba',
        fvxJarSha512: 'jarsha512',
        cleanRomSha512: createHash('sha512').update('rom content').digest('hex'),
      };

      const assignment = {
        id: 1,
        configId: 1,
        seed: 12345,
      };

      const principal = { uuid: 'player-uuid' };
      const romBuffer = Buffer.from('rom content');

      repository.getConfigById.mockResolvedValue(config as any);
      repository.getAssignmentByConfigAndMcUuid.mockResolvedValue(assignment as any);
      // eventsService throws ConflictException when heal fails
      eventsService.settingsJsonBytesForConfig.mockRejectedValueOnce(
        new Error('Config has no settings blob SHA512 matching any preset'),
      );

      const romStream = Readable.from([romBuffer]);

      await expect(
        service.patchRom(1, principal as any, romStream),
      ).rejects.toThrow();
    });

    it('throws 422 if ROM hash does not match', async () => {
      const config = {
        id: 1,
        eventId: 1,
        settingsBlobSha512: 'sha512hash',
        gamePlatform: 'gba',
        fvxJarSha512: 'jarsha512',
        cleanRomSha512: 'expected sha512 hash',
      };

      const assignment = {
        id: 1,
        configId: 1,
        seed: 12345,
      };

      const principal = { uuid: 'player-uuid' };
      const romBuffer = Buffer.from('wrong rom content');

      repository.getConfigById.mockResolvedValue(config as any);
      repository.getAssignmentByConfigAndMcUuid.mockResolvedValue(assignment as any);

      const romStream = Readable.from([romBuffer]);

      await expect(
        service.patchRom(1, principal as any, romStream),
      ).rejects.toThrow();

      // Should have audited the mismatch
      expect(repository.appendAudit).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'ROM_RECEIVED',
          actor: principal.uuid,
          meta: expect.objectContaining({
            expectedSha512: config.cleanRomSha512,
          }),
        }),
      );
    });
  });
});
