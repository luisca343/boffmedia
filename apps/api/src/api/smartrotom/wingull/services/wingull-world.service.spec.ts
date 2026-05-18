import { Test, TestingModule } from '@nestjs/testing';
import * as fs from 'fs';
import { Logger } from 'nestjs-pino';
import { WingullWorldService } from './wingull-world.service';
import { WINGULL_WORLD_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

jest.mock('fs');

const mockRepo = {
  getPerformanceFromAPI: jest.fn(),
  getRegionsFromAPI: jest.fn(),
  getWeatherFromAPI: jest.fn(),
  updateNPCsInAPI: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const makeDirent = (name: string, isDirectory: boolean) =>
  ({ name, isDirectory: () => isDirectory }) as fs.Dirent;

describe('WingullWorldService', () => {
  let service: WingullWorldService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullWorldService,
        { provide: Logger, useValue: mockLogger },
        { provide: WINGULL_WORLD_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WingullWorldService>(WingullWorldService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getPerformance ───────────────────────────────────────────────────────────

  describe('getPerformance()', () => {
    it('returns performance data from repo', async () => {
      const perf = { tps: 20, mspt: 50 } as any;
      mockRepo.getPerformanceFromAPI.mockResolvedValue(perf);

      await expect(service.getPerformance()).resolves.toEqual(perf);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getPerformanceFromAPI.mockRejectedValue(new Error('server down'));

      await expect(service.getPerformance()).rejects.toThrow(
        'Performance data retrieval failed: server down',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── getRegions ───────────────────────────────────────────────────────────────

  describe('getRegions()', () => {
    it('returns regions from repo', async () => {
      const regions = [{ id: 1, name: 'Kanto' }] as any;
      mockRepo.getRegionsFromAPI.mockResolvedValue(regions);

      await expect(service.getRegions()).resolves.toEqual(regions);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getRegionsFromAPI.mockRejectedValue(new Error('not found'));

      await expect(service.getRegions()).rejects.toThrow(
        'Regions data retrieval failed: not found',
      );
    });
  });

  // ─── getWeather ───────────────────────────────────────────────────────────────

  describe('getWeather()', () => {
    it('returns weather from repo', async () => {
      const weather = { condition: 'sunny', temperature: 25 } as any;
      mockRepo.getWeatherFromAPI.mockResolvedValue(weather);

      await expect(service.getWeather()).resolves.toEqual(weather);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getWeatherFromAPI.mockRejectedValue(new Error('timeout'));

      await expect(service.getWeather()).rejects.toThrow(
        'Weather data retrieval failed: timeout',
      );
    });
  });

  // ─── updateNPCs ───────────────────────────────────────────────────────────────

  describe('updateNPCs()', () => {
    const data = { npcs: [{ id: 1, script: 'hello' }] };

    it('delegates to repo and returns result', async () => {
      mockRepo.updateNPCsInAPI.mockResolvedValue({ success: true });

      await expect(service.updateNPCs(data)).resolves.toEqual({ success: true });
      expect(mockRepo.updateNPCsInAPI).toHaveBeenCalledWith(data);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.updateNPCsInAPI.mockRejectedValue(new Error('invalid data'));

      await expect(service.updateNPCs(data)).rejects.toThrow(
        'NPCs update failed: invalid data',
      );
    });
  });

  // ─── getAllTowns ──────────────────────────────────────────────────────────────

  describe('getAllTowns()', () => {
    it('returns names of directories inside pueblos path', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readdirSync as jest.Mock).mockReturnValue([
        makeDirent('Pallet', true),
        makeDirent('Viridian', true),
        makeDirent('readme.txt', false),
      ]);

      const towns = await service.getAllTowns();

      expect(towns).toEqual(['Pallet', 'Viridian']);
    });

    it('throws when towns directory does not exist', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.getAllTowns()).rejects.toThrow(
        'Could not fetch towns list: Towns directory does not exist.',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── getTownInfo ──────────────────────────────────────────────────────────────

  describe('getTownInfo()', () => {
    const townName = 'Pallet';
    const config = { name: 'Pallet Town', description: 'A quiet town.' };

    beforeEach(() => {
      jest.spyOn(service, 'getAllTowns').mockResolvedValue(['Pallet', 'Viridian']);
    });

    it('returns town data when town exists', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(config));
      (fs.readdirSync as jest.Mock).mockReturnValue(['shop.webp', 'gym.webp', 'config.json', 'fondo.webp']);

      const result = await service.getTownInfo(townName);

      expect(result.textos).toEqual(config);
      expect(result.fondo).toBe('/smartrotom/data/pueblos/Pallet/fondo.webp');
      expect(result.images).toEqual([
        '/smartrotom/data/pueblos/Pallet/shop.webp',
        '/smartrotom/data/pueblos/Pallet/gym.webp',
      ]);
    });

    it('throws when town is not in the list', async () => {
      await expect(service.getTownInfo('Unknown')).rejects.toThrow(
        "Could not fetch town info for Unknown: Town 'Unknown' not found.",
      );
    });

    it('throws when town folder does not exist on disk', async () => {
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.getTownInfo(townName)).rejects.toThrow(
        'Could not fetch town info for Pallet',
      );
    });
  });
});
