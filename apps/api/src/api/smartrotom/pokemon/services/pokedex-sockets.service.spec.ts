import { Test, TestingModule } from '@nestjs/testing';
import { PokedexSocketsService } from './pokedex-sockets.service';
import { SocketsGateway } from '@api/_utils/sockets/sockets.gateway';
import { Logger } from 'nestjs-pino';

describe('PokedexSocketsService', () => {
  let service: PokedexSocketsService;
  let mockSocketGateway: any;
  let mockLogger: any;

  beforeEach(async () => {
    mockSocketGateway = {
      emitToUuid: jest.fn(),
      server: {
        emit: jest.fn(),
      },
    };

    mockLogger = {
      warn: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokedexSocketsService,
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

    service = module.get<PokedexSocketsService>(PokedexSocketsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emitCapture', () => {
    it('should emit pokedex:capture event with uuid, pokemonId, and form', () => {
      const uuid = 'test-uuid';
      const pokemonId = 25;
      const form = 'base';

      service.emitCapture(uuid, pokemonId, form);

      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledWith(
        uuid,
        'pokedex:capture',
        expect.objectContaining({
          type: 'pokedex:capture',
          uuid,
          pokemonId,
          form,
        }),
      );
    });

    it('should warn if gateway server is not ready', () => {
      mockSocketGateway.server = null;

      service.emitCapture('uuid', 25, 'base');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'SocketsGateway not ready; capture event not emitted',
        expect.objectContaining({
          uuid: 'uuid',
          pokemonId: 25,
          form: 'base',
        }),
      );
    });
  });

  describe('addressing', () => {
    // The defect this service shipped with: `server.emit` reached EVERY
    // connected socket, so one player's capture invalidated every player's
    // Pokedex and made them all refetch. Swap emitToUuid back for server.emit
    // and both of these fail.
    it('never broadcasts a capture to every socket', () => {
      service.emitCapture('uuid-a', 25, 'base');

      expect(mockSocketGateway.server.emit).not.toHaveBeenCalled();
      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledTimes(1);
    });

    it('addresses the player who owns the dex, and only them', () => {
      service.emitCapture('uuid-a', 25, 'base');
      service.emitDexUpdate('uuid-b');

      const targets = mockSocketGateway.emitToUuid.mock.calls.map(
        (call: unknown[]) => call[0],
      );
      expect(targets).toEqual(['uuid-a', 'uuid-b']);
      expect(mockSocketGateway.server.emit).not.toHaveBeenCalled();
    });
  });

  describe('emitDexUpdate', () => {
    it('should emit pokedex:updated event with uuid', () => {
      const uuid = 'test-uuid';

      service.emitDexUpdate(uuid);

      expect(mockSocketGateway.emitToUuid).toHaveBeenCalledWith(
        uuid,
        'pokedex:updated',
        expect.objectContaining({
          type: 'pokedex:updated',
          uuid,
        }),
      );
    });

    it('should warn if gateway server is not ready', () => {
      mockSocketGateway.server = null;

      service.emitDexUpdate('uuid');

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'SocketsGateway not ready; dex update event not emitted',
        expect.objectContaining({
          uuid: 'uuid',
        }),
      );
    });
  });
});
