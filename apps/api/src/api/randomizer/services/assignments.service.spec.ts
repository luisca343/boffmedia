import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { EventsService } from './events.service';
import { RandomizerRepository } from '../repositories/randomizer.repository';
import { RANDOMIZER_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { PacksDownloadsService } from '@api/packs/packs-downloads.service';
import { Logger } from 'nestjs-pino';
import {
  RANDOMIZER_RUNNER_TOKEN,
  IRandomizerRunner,
} from '../ports/randomizer-runner.port';
import { SETTINGS_SHIM_TOKEN, ISettingsShim } from '../ports/settings-shim.port';
import { Readable } from 'stream';

describe('AssignmentsService', () => {
  let service: AssignmentsService;
  let repository: jest.Mocked<RandomizerRepository>;
  let blobStorage: jest.Mocked<PacksDownloadsService>;
  let eventsService: jest.Mocked<EventsService>;
  let settingsShim: jest.Mocked<ISettingsShim>;
  let runner: jest.Mocked<IRandomizerRunner>;
  let logger: jest.Mocked<Logger>;

  const CLEAN_SHA = 'a'.repeat(128);
  const OUTPUT_SHA = 'b'.repeat(128);
  // The launcher principal is a Boffmedia account; the MC uuid is audit context.
  const principal = { userId: 5, username: 'player', mcUuid: 'player-uuid' };

  const config = {
    id: 1,
    eventId: 1,
    settingsBlobSha512: 'settingssha',
    gamePlatform: 'gba',
    gameTitle: 'pokered',
    fvxJarSha512: 'jarsha',
    cleanRomSha512: CLEAN_SHA,
    romId: 7,
    romHint: null,
    status: 'open',
  } as any;

  const claimedAssignment = {
    id: 10,
    configId: 1,
    mcUuid: principal.mcUuid,
    seed: 12345,
    status: 'claimed',
    outputSha512: null,
  } as any;

  beforeEach(async () => {
    repository = {
      getConfigById: jest.fn(),
      getAssignmentByConfigAndUser: jest.fn(),
      getAssignmentById: jest.fn(),
      createAssignment: jest.fn(),
      resolveEventEntitlement: jest.fn(),
      appendAudit: jest.fn(),
      updateAssignment: jest.fn(),
      getEventPackAndStatus: jest.fn(),
      getPublishedEmulatorRom: jest.fn(),
    } as unknown as jest.Mocked<RandomizerRepository>;

    // Defaults: entitled participant, pack's published ROM matches the config.
    repository.resolveEventEntitlement.mockResolvedValue({
      boffmediaUserId: 42,
      status: 'registered',
    });
    repository.getEventPackAndStatus.mockResolvedValue({
      packId: 'pack1',
      status: 'active',
    });
    repository.getPublishedEmulatorRom.mockResolvedValue({
      state: 'ok',
      versionId: 'v1',
      romPath: 'roms/clean.gba',
      sha512: CLEAN_SHA,
    });

    blobStorage = {
      storeBlob: jest.fn(),
      override: jest.fn(),
      blobSize: jest.fn(),
    } as unknown as jest.Mocked<PacksDownloadsService>;

    eventsService = {
      settingsJsonBytesForConfig: jest.fn(),
    } as unknown as jest.Mocked<EventsService>;

    settingsShim = {
      encode: jest.fn(),
    } as unknown as jest.Mocked<ISettingsShim>;

    runner = {
      randomize: jest.fn(),
    } as unknown as jest.Mocked<IRandomizerRunner>;

    logger = {
      debug: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<Logger>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsService,
        { provide: RANDOMIZER_REPOSITORY_TOKEN, useValue: repository },
        { provide: PacksDownloadsService, useValue: blobStorage },
        { provide: EventsService, useValue: eventsService },
        { provide: SETTINGS_SHIM_TOKEN, useValue: settingsShim },
        { provide: RANDOMIZER_RUNNER_TOKEN, useValue: runner },
        { provide: Logger, useValue: logger },
      ],
    }).compile();

    service = module.get<AssignmentsService>(AssignmentsService);
  });

  describe('getOrGenerateRom', () => {
    it('streams the cached blob without calling the runner when output exists on disk', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser.mockResolvedValue({
        ...claimedAssignment,
        outputSha512: OUTPUT_SHA,
        status: 'patched',
      });
      blobStorage.blobSize.mockResolvedValue(1024); // cached output present
      blobStorage.override.mockResolvedValue({
        stream: Readable.from(Buffer.from('cached rom')),
        contentType: 'application/octet-stream',
        contentLength: 10,
        filename: OUTPUT_SHA,
      } as any);

      const result = await service.getOrGenerateRom(1, principal as any);

      expect(result.outputSha512).toBe(OUTPUT_SHA);
      expect(result.contentLength).toBe(10);
      expect(runner.randomize).not.toHaveBeenCalled();
      expect(blobStorage.override).toHaveBeenCalledWith(OUTPUT_SHA);
      expect(repository.appendAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROM_SERVED' }),
      );
    });

    it('generates on first request: clean stream + encoded settings + seed, then caches', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser.mockResolvedValue(
        claimedAssignment,
      );
      const cleanStream = Readable.from(Buffer.from('clean rom'));
      // blobSize: clean present (number), then override(clean) for generation,
      // override(output) for streaming back.
      blobStorage.blobSize.mockResolvedValue(2048); // clean blob present
      blobStorage.override
        .mockResolvedValueOnce({
          stream: cleanStream,
          contentType: 'application/octet-stream',
          contentLength: 9,
          filename: CLEAN_SHA,
        } as any)
        .mockResolvedValueOnce({
          stream: Readable.from(Buffer.from('randomized rom')),
          contentType: 'application/octet-stream',
          contentLength: 14,
          filename: OUTPUT_SHA,
        } as any);
      eventsService.settingsJsonBytesForConfig.mockResolvedValue(
        Buffer.from(JSON.stringify({ foo: 'bar' })),
      );
      settingsShim.encode.mockResolvedValue(Buffer.from('rnqs'));
      runner.randomize.mockResolvedValue({
        romBytes: Buffer.from('randomized rom'),
        outputSha512: OUTPUT_SHA,
        logBytes: Buffer.from('log'),
      } as any);
      blobStorage.storeBlob
        .mockResolvedValueOnce({ sha512: OUTPUT_SHA, size: 14 }) // output blob
        .mockResolvedValueOnce({ sha512: 'c'.repeat(128), size: 3 }); // log blob

      const result = await service.getOrGenerateRom(1, principal as any);

      expect(runner.randomize).toHaveBeenCalledWith(
        expect.objectContaining({
          romStream: cleanStream,
          settingsRnqs: Buffer.from('rnqs'),
          seed: 12345,
        }),
      );
      expect(repository.updateAssignment).toHaveBeenCalledWith(
        10,
        expect.objectContaining({
          outputSha512: OUTPUT_SHA,
          status: 'patched',
        }),
      );
      expect(repository.appendAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ROM_GENERATED' }),
      );
      expect(result.outputSha512).toBe(OUTPUT_SHA);
    });

    it('mints the assignment when open and unclaimed, then generates', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser.mockResolvedValue(null); // unclaimed
      repository.resolveEventEntitlement.mockResolvedValue({
        boffmediaUserId: 42,
        status: 'registered',
      });
      repository.createAssignment.mockResolvedValue(10);
      repository.getAssignmentById.mockResolvedValue(claimedAssignment);
      blobStorage.blobSize.mockResolvedValue(2048);
      blobStorage.override
        .mockResolvedValueOnce({
          stream: Readable.from(Buffer.from('clean rom')),
          contentLength: 9,
        } as any)
        .mockResolvedValueOnce({
          stream: Readable.from(Buffer.from('randomized rom')),
          contentLength: 14,
        } as any);
      eventsService.settingsJsonBytesForConfig.mockResolvedValue(
        Buffer.from('{}'),
      );
      settingsShim.encode.mockResolvedValue(Buffer.from('rnqs'));
      runner.randomize.mockResolvedValue({
        romBytes: Buffer.from('randomized rom'),
        outputSha512: OUTPUT_SHA,
        logBytes: Buffer.from('log'),
      } as any);
      blobStorage.storeBlob
        .mockResolvedValueOnce({ sha512: OUTPUT_SHA, size: 14 })
        .mockResolvedValueOnce({ sha512: 'c'.repeat(128), size: 3 });

      const result = await service.getOrGenerateRom(1, principal as any);

      expect(repository.createAssignment).toHaveBeenCalled();
      expect(runner.randomize).toHaveBeenCalled();
      expect(result.outputSha512).toBe(OUTPUT_SHA);
    });

    it('throws 409 when the config has no base ROM on the server', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser.mockResolvedValue(
        claimedAssignment,
      );
      blobStorage.blobSize.mockResolvedValue(null); // clean blob missing

      await expect(
        service.getOrGenerateRom(1, principal as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(runner.randomize).not.toHaveBeenCalled();
    });

    it('404s an unclaimed user when the config is not open', async () => {
      repository.getConfigById.mockResolvedValue({ ...config, status: 'closed' });
      repository.getAssignmentByConfigAndUser.mockResolvedValue(null);

      await expect(
        service.getOrGenerateRom(1, principal as any),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('403s an existing assignment when the participant was removed from the event', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.resolveEventEntitlement.mockResolvedValue(null); // revoked
      repository.getAssignmentByConfigAndUser.mockResolvedValue({
        ...claimedAssignment,
        outputSha512: OUTPUT_SHA,
        status: 'patched',
      });

      await expect(
        service.getOrGenerateRom(1, principal as any),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(runner.randomize).not.toHaveBeenCalled();
      expect(blobStorage.override).not.toHaveBeenCalled();
    });

    it('409s when the pack publishes a ROM that differs from the pinned clean ROM', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getPublishedEmulatorRom.mockResolvedValue({
        state: 'ok',
        versionId: 'v2',
        romPath: 'roms/clean.gba',
        sha512: 'f'.repeat(128), // != CLEAN_SHA
      });

      await expect(
        service.getOrGenerateRom(1, principal as any),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(runner.randomize).not.toHaveBeenCalled();
    });

    it('re-reads the winner row when a concurrent mint hits the unique key', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser
        .mockResolvedValueOnce(null) // pre-insert check: unclaimed
        .mockResolvedValueOnce({
          ...claimedAssignment,
          outputSha512: OUTPUT_SHA,
          status: 'patched',
        }); // post-conflict re-read
      repository.createAssignment.mockRejectedValue(
        new Error('Assignment creation failed: ER_DUP_ENTRY'),
      );
      blobStorage.blobSize.mockResolvedValue(1024);
      blobStorage.override.mockResolvedValue({
        stream: Readable.from(Buffer.from('cached rom')),
        contentLength: 10,
      } as any);

      const result = await service.getOrGenerateRom(1, principal as any);

      expect(result.outputSha512).toBe(OUTPUT_SHA);
      expect(runner.randomize).not.toHaveBeenCalled();
    });

    it('single-flights concurrent generation (runner runs once)', async () => {
      repository.getConfigById.mockResolvedValue(config);
      repository.getAssignmentByConfigAndUser.mockResolvedValue(
        claimedAssignment,
      );
      blobStorage.blobSize.mockResolvedValue(2048);
      blobStorage.override.mockResolvedValue({
        stream: Readable.from(Buffer.from('rom')),
        contentLength: 3,
      } as any);
      eventsService.settingsJsonBytesForConfig.mockResolvedValue(
        Buffer.from('{}'),
      );
      settingsShim.encode.mockResolvedValue(Buffer.from('rnqs'));
      let resolveRandomize: (v: any) => void = () => {};
      runner.randomize.mockReturnValue(
        new Promise((r) => {
          resolveRandomize = r;
        }) as any,
      );
      blobStorage.storeBlob.mockResolvedValue({ sha512: OUTPUT_SHA, size: 3 });

      const p1 = service.getOrGenerateRom(1, principal as any);
      const p2 = service.getOrGenerateRom(1, principal as any);
      // let both reach the in-flight lock
      await new Promise((r) => setImmediate(r));
      resolveRandomize({
        romBytes: Buffer.from('rom'),
        outputSha512: OUTPUT_SHA,
        logBytes: Buffer.from('log'),
      });
      await Promise.all([p1, p2]);

      expect(runner.randomize).toHaveBeenCalledTimes(1);
    });
  });
});
