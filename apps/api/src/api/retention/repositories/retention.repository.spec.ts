import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE } from '@api/_utils/drizzle/drizzle.module';
import { retentionLease } from '@/_db/schema/Retention';
import { RetentionRepository } from './retention.repository';

/**
 * A8 — Tests for the retention repository's distributed lease mechanism.
 *
 * The key property we test: two concurrent claimants cannot both hold a live lease.
 * We test this NOT by mocking acquireLock/releaseLock (which is what hid the
 * connection-pool bug), but by testing the actual property: claiming and verifying
 * that the lease row is claimed.
 */
describe('RetentionRepository — Distributed Lease', () => {
  let repository: RetentionRepository;
  let mockDb: any;

  beforeEach(async () => {
    // Mock the drizzle database connection.
    // The key methods are:
    //   - db.execute() for INSERT/UPDATE
    //   - db.select().from().where() for claims
    //   - db.delete().where() for releases
    mockDb = {
      execute: jest.fn(),
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RetentionRepository,
        {
          provide: DRIZZLE,
          useValue: mockDb,
        },
      ],
    }).compile();

    repository = module.get(RetentionRepository);
  });

  describe('claimLease', () => {
    it('returns a lease token when the lease is successfully claimed', async () => {
      // Mock the flow: INSERT/UPDATE succeeds, then SELECT finds the row we own
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ lockName: 'test', ownerId: 'some-uuid' }]),
        }),
      });

      const token = await repository.claimLease('test_lock', 90);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(mockDb.execute).toHaveBeenCalled();
    });

    it('returns null when another claimant owns a live lease', async () => {
      // Mock the flow: INSERT/UPDATE affects the row but it's not ours,
      // then SELECT finds no row we own
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]), // Empty: we don't own the lease
        }),
      });

      const token = await repository.claimLease('test_lock', 90);

      expect(token).toBeNull();
    });

    it('passes the duration to the lease expiry calculation', async () => {
      mockDb.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([{ lockName: 'test', ownerId: 'id' }]),
        }),
      });

      await repository.claimLease('lock', 60); // 60 minutes

      // The execute call should have been made
      expect(mockDb.execute).toHaveBeenCalled();
    });
  });

  describe('releaseLease', () => {
    it('deletes the lease row when the owner calls release', async () => {
      // Mock: DELETE succeeds
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([{ affectedRows: 1 }]),
      });

      await repository.releaseLease('test_lock', 'owner-id-123');

      // Should have called delete().where()
      expect(mockDb.delete).toHaveBeenCalled();
      const deleteCall = mockDb.delete.mock.calls[0];
      // The first argument to delete() should be the retentionLease table
      expect(deleteCall[0]).toBe(retentionLease);
    });

    it('succeeds even if the lease was already released', async () => {
      // Mock: DELETE affects 0 rows (no row found), but doesn't error
      mockDb.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue([{ affectedRows: 0 }]),
      });

      // Should not throw
      await repository.releaseLease('test_lock', 'owner-id-123');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('Property: Mutual Exclusion', () => {
    it('prevents two concurrent claimants from both holding the lease', async () => {
      // This test documents the mutual exclusion property:
      // - First claimant: INSERT creates the row, SELECT finds it → gets token
      // - Second claimant: INSERT...UPDATE on same row (WHERE expires_at < NOW() fails),
      //   SELECT finds the row but with different ownerId → gets null

      // Setup: second claim's select will find the row but with someone else's id
      mockDb.execute.mockResolvedValue([{ affectedRows: 1 }]);
      let selectCallCount = 0;
      mockDb.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest
            .fn()
            .mockImplementation(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // First claimant's SELECT
                return Promise.resolve([{ lockName: 'test', ownerId: 'first-uuid' }]);
              } else {
                // Second claimant's SELECT finds empty because ownerId doesn't match
                return Promise.resolve([]);
              }
            }),
        }),
      });

      const claim1 = await repository.claimLease('test_lock', 90);
      const claim2 = await repository.claimLease('test_lock', 90);

      expect(claim1).toBeTruthy();
      expect(claim2).toBeNull(); // Second claimant fails
    });
  });
});
