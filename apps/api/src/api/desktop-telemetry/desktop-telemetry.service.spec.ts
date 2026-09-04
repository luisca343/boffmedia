import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { DesktopTelemetryService } from './desktop-telemetry.service';
import { DesktopTelemetryEventDto } from './dto/desktop-telemetry.dto';
import { DesktopTelemetryRepository } from './repositories/desktop-telemetry.repository';

describe('DesktopTelemetryService', () => {
  let service: DesktopTelemetryService;
  let repository: jest.Mocked<
    Pick<DesktopTelemetryRepository, 'countEventsSince' | 'insertEvent'>
  >;

  beforeEach(async () => {
    repository = {
      countEventsSince: jest.fn().mockResolvedValue(0),
      insertEvent: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesktopTelemetryService,
        { provide: DesktopTelemetryRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<DesktopTelemetryService>(DesktopTelemetryService);
  });

  describe('ingestEvent', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should accept a valid install-done:success event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'success',
      };

      await service.ingestEvent(dto);

      expect(repository.insertEvent).toHaveBeenCalledWith({
        installId: validUuid,
        eventName: 'install-done',
        code: 'success',
      });
    });

    it('should accept a valid crash-code:missing-dependency event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'crash-code',
        code: 'missing-dependency',
      };

      await service.ingestEvent(dto);

      expect(repository.insertEvent).toHaveBeenCalled();
    });

    it('should accept a valid tool-open:vgc event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'tool-open',
        code: 'vgc',
      };

      await service.ingestEvent(dto);

      expect(repository.insertEvent).toHaveBeenCalled();
    });

    it('should count only events inside the trailing hour', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'launch',
        code: 'launch',
      };

      const before = Date.now();
      await service.ingestEvent(dto);

      expect(repository.countEventsSince).toHaveBeenCalledTimes(1);
      const [installId, since] = repository.countEventsSince.mock.calls[0];
      expect(installId).toBe(validUuid);
      // The window is one hour back from now, not an all-time count.
      const windowMs = before - since.getTime();
      expect(windowMs).toBeGreaterThanOrEqual(60 * 60 * 1000);
      expect(windowMs).toBeLessThan(60 * 60 * 1000 + 5000);
    });

    it('should reject invalid UUID', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: 'not-a-uuid',
        eventName: 'install-done',
        code: 'success',
      };

      await expect(service.ingestEvent(dto)).rejects.toThrow(HttpException);
      const error = await service.ingestEvent(dto).catch((e) => e);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      // Rejected before it ever reaches the database.
      expect(repository.countEventsSince).not.toHaveBeenCalled();
      expect(repository.insertEvent).not.toHaveBeenCalled();
    });

    it('should reject mismatched code for event type', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'missing-dependency', // wrong: missing-dependency is for crash-code
      };

      await expect(service.ingestEvent(dto)).rejects.toThrow(HttpException);
      const error = await service.ingestEvent(dto).catch((e) => e);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
      expect(repository.insertEvent).not.toHaveBeenCalled();
    });

    it('should reject when rate limit exceeded (100 events in 1 hour)', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'success',
      };

      repository.countEventsSince.mockResolvedValue(100);

      await expect(service.ingestEvent(dto)).rejects.toThrow(HttpException);
      const error = await service.ingestEvent(dto).catch((e) => e);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      expect(repository.insertEvent).not.toHaveBeenCalled();
    });
  });
});
