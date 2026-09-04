import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { MySql2Database } from 'drizzle-orm/mysql2';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { DesktopTelemetryService } from './desktop-telemetry.service';
import { DesktopTelemetryEventDto } from './dto/desktop-telemetry.dto';
import { desktopTelemetryEvents } from '@/_db/schema/DesktopTelemetry';

describe('DesktopTelemetryService', () => {
  let service: DesktopTelemetryService;
  let db: MySql2Database<Record<string, never>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesktopTelemetryService,
        {
          provide: DRIZZLE,
          useValue: {
            select: jest.fn(),
            insert: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DesktopTelemetryService>(DesktopTelemetryService);
    db = module.get<MySql2Database<Record<string, never>>>(DRIZZLE);
  });

  describe('ingestEvent', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000';

    it('should accept a valid install-done:success event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'success',
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock).mockImplementation(selectMock);
      (db.insert as jest.Mock).mockImplementation(insertMock);

      await service.ingestEvent(dto);

      expect(insertMock).toHaveBeenCalledWith(desktopTelemetryEvents);
    });

    it('should accept a valid crash-code:missing-dependency event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'crash-code',
        code: 'missing-dependency',
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock).mockImplementation(selectMock);
      (db.insert as jest.Mock).mockImplementation(insertMock);

      await service.ingestEvent(dto);

      expect(insertMock).toHaveBeenCalled();
    });

    it('should accept a valid tool-open:vgc event', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'tool-open',
        code: 'vgc',
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      const insertMock = jest.fn().mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      (db.select as jest.Mock).mockImplementation(selectMock);
      (db.insert as jest.Mock).mockImplementation(insertMock);

      await service.ingestEvent(dto);

      expect(insertMock).toHaveBeenCalled();
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
    });

    it('should reject mismatched code for event type', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'missing-dependency', // wrong: missing-dependency is for crash-code
      };

      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 0 }]),
        }),
      });

      (db.select as jest.Mock).mockImplementation(selectMock);

      await expect(service.ingestEvent(dto)).rejects.toThrow(HttpException);
      const error = await service.ingestEvent(dto).catch((e) => e);
      expect(error.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    });

    it('should reject when rate limit exceeded (100 events in 1 hour)', async () => {
      const dto: DesktopTelemetryEventDto = {
        installId: validUuid,
        eventName: 'install-done',
        code: 'success',
      };

      // The service asks the database for a COUNT rather than the rows, so the
      // mock resolves to a single count row — the shape drizzle really returns.
      const selectMock = jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 100 }]),
        }),
      });

      (db.select as jest.Mock).mockImplementation(selectMock);

      await expect(service.ingestEvent(dto)).rejects.toThrow(HttpException);
      const error = await service.ingestEvent(dto).catch((e) => e);
      expect(error.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });
  });
});
