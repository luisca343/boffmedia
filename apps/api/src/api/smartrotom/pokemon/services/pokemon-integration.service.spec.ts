import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { PokemonIntegrationService } from './pokemon-integration.service';
import { PokemonShowdownService } from './pokemon-showdown.service';
import { WingullFacadeService } from '../../wingull/wingull.facade.service';
import { PokedexManagementService } from './pokedex-management.service';

const mockShowdownService = { getTerasPokemonShowdownData: jest.fn() };
const mockWingullFacade = { updateDex: jest.fn() };
const mockPokedexManagement = { bulkUpdateDex: jest.fn() };
const mockLogger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };

describe('PokemonIntegrationService', () => {
  let service: PokemonIntegrationService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonIntegrationService,
        { provide: Logger, useValue: mockLogger },
        { provide: PokemonShowdownService, useValue: mockShowdownService },
        { provide: WingullFacadeService, useValue: mockWingullFacade },
        { provide: PokedexManagementService, useValue: mockPokedexManagement },
      ],
    }).compile();

    service = module.get<PokemonIntegrationService>(PokemonIntegrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTerasPokemonShowdownData ──────────────────────────────────────────────

  describe('getTerasPokemonShowdownData()', () => {
    it('delegates to PokemonShowdownService', async () => {
      const data = { pikachu: { num: 25 } };
      mockShowdownService.getTerasPokemonShowdownData.mockResolvedValue(data);

      const result = await service.getTerasPokemonShowdownData();

      expect(
        mockShowdownService.getTerasPokemonShowdownData,
      ).toHaveBeenCalledTimes(1);
      expect(result).toEqual(data);
    });

    it('wraps errors with descriptive message', async () => {
      mockShowdownService.getTerasPokemonShowdownData.mockRejectedValue(
        new Error('data missing'),
      );

      await expect(service.getTerasPokemonShowdownData()).rejects.toThrow(
        'Showdown data retrieval failed',
      );
    });
  });

  // ─── updateWingullDex ─────────────────────────────────────────────────────────

  describe('updateWingullDex()', () => {
    it('delegates to WingullFacadeService.updateDex', async () => {
      mockWingullFacade.updateDex.mockResolvedValue({ success: true });

      const result = await service.updateWingullDex('test-uuid');

      expect(mockWingullFacade.updateDex).toHaveBeenCalledWith('test-uuid');
      expect(result).toEqual({ success: true });
    });

    it('wraps errors with descriptive message', async () => {
      mockWingullFacade.updateDex.mockRejectedValue(new Error('server down'));

      await expect(service.updateWingullDex('test-uuid')).rejects.toThrow(
        'Wingull dex update failed',
      );
    });
  });

  // ─── updateDexWithSync ────────────────────────────────────────────────────────

  describe('updateDexWithSync()', () => {
    const data = { SEEN: [1, 4, 7], CAUGHT: [1, 4] };

    it('updates local dex and syncs with Wingull on success', async () => {
      mockPokedexManagement.bulkUpdateDex.mockResolvedValue({
        success: true,
        message: 'ok',
        results: {},
      });
      mockWingullFacade.updateDex.mockResolvedValue(undefined);

      const result = await service.updateDexWithSync('test-uuid', data);

      expect(mockPokedexManagement.bulkUpdateDex).toHaveBeenCalledWith(
        'test-uuid',
        data,
      );
      expect(mockWingullFacade.updateDex).toHaveBeenCalledWith('test-uuid');
      expect(result.success).toBe(true);
    });

    it('does not sync with Wingull when bulkUpdateDex returns success=false', async () => {
      mockPokedexManagement.bulkUpdateDex.mockResolvedValue({
        success: false,
        message: 'fail',
        results: {},
      });

      await service.updateDexWithSync('test-uuid', data);

      expect(mockWingullFacade.updateDex).not.toHaveBeenCalled();
    });

    it('still returns update result when Wingull sync fails', async () => {
      mockPokedexManagement.bulkUpdateDex.mockResolvedValue({
        success: true,
        message: 'ok',
        results: {},
      });
      mockWingullFacade.updateDex.mockRejectedValue(
        new Error('wingull offline'),
      );

      const result = await service.updateDexWithSync('test-uuid', data);

      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('throws when bulkUpdateDex throws', async () => {
      mockPokedexManagement.bulkUpdateDex.mockRejectedValue(
        new Error('db error'),
      );

      await expect(
        service.updateDexWithSync('test-uuid', data),
      ).rejects.toThrow('Dex update with sync failed');
    });
  });
});
