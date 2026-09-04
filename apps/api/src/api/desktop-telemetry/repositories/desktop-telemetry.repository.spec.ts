import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { DesktopTelemetryRepository } from './desktop-telemetry.repository';
import { desktopTelemetryEvents } from '@/_db/schema/DesktopTelemetry';

describe('DesktopTelemetryRepository', () => {
  let repository: DesktopTelemetryRepository;
  let db: { select: jest.Mock; insert: jest.Mock };

  beforeEach(async () => {
    db = { select: jest.fn(), insert: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DesktopTelemetryRepository,
        { provide: DRIZZLE, useValue: db },
      ],
    }).compile();

    repository = module.get(DesktopTelemetryRepository);
  });

  describe('countEventsSince', () => {
    it('asks the database for a COUNT, never for the rows', async () => {
      // This is a security property, not a style preference. The ingest endpoint
      // is public and unauthenticated, so selecting every matching row to measure
      // its length would make flooding it cheaper for the attacker and more
      // expensive for us with each event they send: the rate limiter would
      // become the amplifier.
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: 7 }]),
        }),
      });

      const count = await repository.countEventsSince(
        '550e8400-e29b-41d4-a716-446655440000',
        new Date(0),
      );

      expect(count).toBe(7);
      expect(db.select).toHaveBeenCalledTimes(1);
      const projection = db.select.mock.calls[0][0];
      expect(projection).toBeDefined();
      expect(Object.keys(projection)).toEqual(['count']);
    });

    it('returns 0 when the count row is missing', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(
        repository.countEventsSince(
          '550e8400-e29b-41d4-a716-446655440000',
          new Date(0),
        ),
      ).resolves.toBe(0);
    });

    it('coerces a string count (mysql2 returns bigints as strings)', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ count: '42' }]),
        }),
      });

      await expect(
        repository.countEventsSince(
          '550e8400-e29b-41d4-a716-446655440000',
          new Date(0),
        ),
      ).resolves.toBe(42);
    });
  });

  describe('insertEvent', () => {
    it('inserts into the telemetry events table', async () => {
      const values = jest.fn().mockResolvedValue(undefined);
      db.insert.mockReturnValue({ values });

      await repository.insertEvent({
        installId: '550e8400-e29b-41d4-a716-446655440000',
        eventName: 'launch',
        code: 'launch',
      });

      expect(db.insert).toHaveBeenCalledWith(desktopTelemetryEvents);
      expect(values).toHaveBeenCalledWith({
        installId: '550e8400-e29b-41d4-a716-446655440000',
        eventName: 'launch',
        code: 'launch',
      });
    });
  });
});
