import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { WingullTransportService } from './wingull-transport.service';
import { WINGULL_TRANSPORT_REPOSITORY_TOKEN } from '@api/_utils/repositories/interfaces/repository.token';

const mockRepo = {
  getTaxiStopsFromAPI: jest.fn(),
  teleportPlayerInAPI: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

describe('WingullTransportService', () => {
  let service: WingullTransportService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WingullTransportService,
        { provide: Logger, useValue: mockLogger },
        { provide: WINGULL_TRANSPORT_REPOSITORY_TOKEN, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<WingullTransportService>(WingullTransportService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── getTaxiStops ─────────────────────────────────────────────────────────────

  describe('getTaxiStops()', () => {
    it('returns taxi stops from repo', async () => {
      const stops = [{ id: 'pallet', name: 'Pallet Town' }] as any;
      mockRepo.getTaxiStopsFromAPI.mockResolvedValue(stops);

      await expect(service.getTaxiStops()).resolves.toEqual(stops);
      expect(mockRepo.getTaxiStopsFromAPI).toHaveBeenCalledTimes(1);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getTaxiStopsFromAPI.mockRejectedValue(
        new Error('API unavailable'),
      );

      await expect(service.getTaxiStops()).rejects.toThrow(
        'Taxi stops retrieval failed: API unavailable',
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  // ─── teleportPlayer ───────────────────────────────────────────────────────────

  describe('teleportPlayer()', () => {
    const stopId = 'pallet';
    const uuid = 'abc-123';

    it('reports a successful teleport', async () => {
      mockRepo.teleportPlayerInAPI.mockResolvedValue({ ok: true });

      await expect(service.teleportPlayer(stopId, uuid)).resolves.toEqual({
        ok: true,
      });
    });

    it('constructs TeleportRequestDto with id and uuid', async () => {
      mockRepo.teleportPlayerInAPI.mockResolvedValue({ ok: true });

      await service.teleportPlayer(stopId, uuid);

      expect(mockRepo.teleportPlayerInAPI).toHaveBeenCalledWith(
        expect.objectContaining({ id: stopId, uuid }),
      );
    });

    // The whole point of the outcome type: "offline, nothing happened" and "no answer, it may
    // have happened" decide opposite things about the fare, so neither may be flattened.
    it.each([
      ['offline', 422],
      ['unknown_stop', 404],
      ['unsafe_arrival', 409],
      ['in_dungeon_run', 409],
      ['unresolved', 503],
    ])('passes the %s refusal through untouched', async (reason, status) => {
      const refusal = { ok: false, reason, status, message: 'nope' };
      mockRepo.teleportPlayerInAPI.mockResolvedValue(refusal);

      await expect(service.teleportPlayer(stopId, uuid)).resolves.toEqual(
        refusal,
      );
    });
  });
});
