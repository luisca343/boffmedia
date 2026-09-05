import { Test, TestingModule } from '@nestjs/testing';
import { PokedexManagementService } from './pokedex-management.service';
import { PokedexSocketsService } from './pokedex-sockets.service';
import { PokemonDataManagementService } from './pokemon-data-management.service';
import { SocketsGateway } from '@api/_utils/sockets/sockets.gateway';
import { POKEMON_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';
import { Logger } from 'nestjs-pino';

/**
 * Integration test verifying that socket events are emitted when Pokédex changes.
 * This test ensures the complete flow: registerPokemon/bulkUpdateDex → socket emit.
 */
describe('PokedexManagementService - Socket Integration', () => {
  let service: PokedexManagementService;
  let socketsService: PokedexSocketsService;
  let mockRepository: any;
  let mockPokemonDataService: any;
  let mockLogger: any;
  let mockSocketGateway: any;

  beforeEach(async () => {
    mockRepository = {
      findPokedexRegistry: jest.fn(),
      createPokedexRegistry: jest.fn(),
      updatePokedexRegistry: jest.fn(),
      getAllUserPokedexRegistries: jest.fn(),
      bulkInsertPokedexRegistries: jest.fn(),
      bulkUpdatePokedexRegistriesStatus: jest.fn(),
      getPokedexStatistics: jest.fn(),
      getDetailedPokedexStatus: jest.fn(),
    };

    mockPokemonDataService = {
      countPokemon: jest.fn().mockReturnValue(1025),
    };

    mockLogger = {
      error: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };

    mockSocketGateway = {
      emitToUuid: jest.fn(),
      server: {
        emit: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokedexManagementService,
        PokedexSocketsService,
        {
          provide: POKEMON_REPOSITORY_TOKEN,
          useValue: mockRepository,
        },
        {
          provide: PokemonDataManagementService,
          useValue: mockPokemonDataService,
        },
        {
          provide: SocketsGateway,
          useValue: mockSocketGateway,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<PokedexManagementService>(PokedexManagementService);
    socketsService = module.get<PokedexSocketsService>(PokedexSocketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPokemon - Socket Emission on Capture', () => {
    it('should emit pokedex:capture event when Pokemon is caught (status=1, new)', async () => {
      const uuid = 'test-uuid';
      const pokemonId = 25; // Pikachu
      const form = 'base';
      const palette = 'none';

      mockRepository.findPokedexRegistry.mockResolvedValue(null);
      mockRepository.createPokedexRegistry.mockResolvedValue({ success: true });

      const result = await service.registerPokemon(
        uuid,
        pokemonId,
        form,
        palette,
        1, // status=1 means caught
      );

      expect(result.success).toBe(true);
      expect(result.isNew).toBe(true);

      // Verify socket emit was called
      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledWith(
        expect.any(String),
        'pokedex:capture',
        expect.objectContaining({
          type: 'pokedex:capture',
          uuid,
          pokemonId,
          form,
        }),
      );
    });

    it('should emit pokedex:capture event when Pokemon is caught (status=1, updating seen to caught)', async () => {
      const uuid = 'test-uuid';
      const pokemonId = 25;
      const form = 'base';
      const palette = 'none';

      // Existing seen registry
      mockRepository.findPokedexRegistry.mockResolvedValue({
        uuid,
        pokemonId,
        formId: form,
        paletteId: palette,
        seenAt: new Date(),
        caughtAt: null,
      });
      mockRepository.updatePokedexRegistry.mockResolvedValue({
        success: true,
      });

      const result = await service.registerPokemon(
        uuid,
        pokemonId,
        form,
        palette,
        1, // Now catching what was previously seen
      );

      expect(result.success).toBe(true);
      expect(result.wasUpdated).toBe(true);

      // Verify socket emit was called
      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledWith(
        expect.any(String),
        'pokedex:capture',
        expect.objectContaining({
          type: 'pokedex:capture',
          uuid,
          pokemonId,
          form,
        }),
      );
    });

    it('should NOT emit socket event when Pokemon is only seen (status=0)', async () => {
      const uuid = 'test-uuid';
      const pokemonId = 25;
      const form = 'base';
      const palette = 'none';

      mockRepository.findPokedexRegistry.mockResolvedValue(null);
      mockRepository.createPokedexRegistry.mockResolvedValue({ success: true });

      const result = await service.registerPokemon(
        uuid,
        pokemonId,
        form,
        palette,
        0, // status=0 means seen only, not caught
      );

      expect(result.success).toBe(true);

      // Verify socket emit was NOT called
      const socketEmit = socketsService['socketGateway']
        .emitToUuid as jest.Mock;
      expect(socketEmit).not.toHaveBeenCalled();
    });
  });

  describe('bulkUpdateDex - Socket Emission on Dex Changes', () => {
    it('should emit pokedex:updated event when caught pokemon are added', async () => {
      const uuid = 'test-uuid';
      const data = {
        SEEN: [1, 2, 3],
        CAUGHT: [4, 5],
      };

      mockRepository.getAllUserPokedexRegistries.mockResolvedValue([]);
      mockRepository.bulkInsertPokedexRegistries.mockResolvedValue({
        insertedCount: 5,
      });
      mockRepository.bulkUpdatePokedexRegistriesStatus.mockResolvedValue({
        updatedCount: 0,
      });

      const result = await service.bulkUpdateDex(uuid, data);

      expect(result.success).toBe(true);

      // Verify socket emit was called for dex update
      const socketEmit = socketsService['socketGateway']
        .emitToUuid as jest.Mock;
      expect(socketEmit).toHaveBeenCalledWith(
        uuid,
        'pokedex:updated',
        expect.objectContaining({
          type: 'pokedex:updated',
          uuid,
        }),
      );
    });

    it('should NOT emit socket event when no changes are made', async () => {
      const uuid = 'test-uuid';
      const data = {
        SEEN: [],
        CAUGHT: [],
      };

      mockRepository.getAllUserPokedexRegistries.mockResolvedValue([]);

      const result = await service.bulkUpdateDex(uuid, data);

      expect(result.success).toBe(true);

      // Verify socket emit was NOT called (no changes)
      const socketEmit = socketsService['socketGateway']
        .emitToUuid as jest.Mock;
      expect(socketEmit).not.toHaveBeenCalled();
    });

    it('should emit socket event when existing seen pokemon are updated to caught', async () => {
      const uuid = 'test-uuid';
      const data = {
        SEEN: [],
        CAUGHT: [10, 11, 12],
      };

      mockRepository.getAllUserPokedexRegistries.mockResolvedValue([
        {
          pokemonId: 10,
          formId: 'base',
          paletteId: 'none',
          seenAt: new Date(),
          caughtAt: null,
        },
      ]);
      mockRepository.bulkInsertPokedexRegistries.mockResolvedValue({
        insertedCount: 2, // pokemon 11, 12
      });
      mockRepository.bulkUpdatePokedexRegistriesStatus.mockResolvedValue({
        updatedCount: 1, // pokemon 10 updated
      });

      const result = await service.bulkUpdateDex(uuid, data);

      expect(result.success).toBe(true);

      // Verify socket emit was called
      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledWith(
        expect.any(String),
        'pokedex:updated',
        expect.objectContaining({
          type: 'pokedex:updated',
          uuid,
        }),
      );
    });
  });
});
