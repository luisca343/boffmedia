import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { InviteManagementService } from './invite-management.service';
import { InvitesRepository } from '@repositories/boffmedia/invites.repository';

const mockRepo = {
  findInviteById: jest.fn(),
  findAllInvites: jest.fn(),
  findActiveInviteById: jest.fn(),
  findInvitesByUuid: jest.fn(),
  findInvitesByUsername: jest.fn(),
  createInvite: jest.fn(),
  markInviteAsUsed: jest.fn(),
  markInviteAsDeleted: jest.fn(),
  deleteInvite: jest.fn(),
  getInviteCount: jest.fn(),
  getActiveInviteCount: jest.fn(),
  getUsedInviteCount: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockInvite = {
  id: 'ABC123',
  uuid: 'user-uuid',
  username: 'TrainerAsh',
  usedAt: null,
  deletedAt: null,
  createdAt: new Date(),
};

describe('InviteManagementService', () => {
  let service: InviteManagementService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InviteManagementService,
        { provide: Logger, useValue: mockLogger },
        { provide: InvitesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<InviteManagementService>(InviteManagementService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createInvite ─────────────────────────────────────────────────────────────

  describe('createInvite()', () => {
    const data = { id: 'ABC123', uuid: 'user-uuid', username: 'TrainerAsh' } as any;

    it('returns success when invite is created', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);
      mockRepo.createInvite.mockResolvedValue({ success: true, invite: mockInvite });

      const result = await service.createInvite(data);

      expect(result.success).toBe(true);
      expect(result.invite).toEqual(mockInvite);
    });

    it('returns failure when invite with same id already exists', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);

      const result = await service.createInvite(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already exists');
      expect(mockRepo.createInvite).not.toHaveBeenCalled();
    });

    it('returns failure when repo creation fails', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);
      mockRepo.createInvite.mockResolvedValue({ success: false, message: 'DB error' });

      const result = await service.createInvite(data);

      expect(result.success).toBe(false);
    });

    it('returns failure on repo exception (does not throw)', async () => {
      mockRepo.findInviteById.mockRejectedValue(new Error('connection lost'));

      const result = await service.createInvite(data);

      expect(result.success).toBe(false);
      expect(result.message).toContain('connection lost');
    });
  });

  // ─── getAllInvites / getInviteById / getActiveInviteById ──────────────────────

  describe('getAllInvites()', () => {
    it('returns all invites from repo', async () => {
      mockRepo.findAllInvites.mockResolvedValue([mockInvite]);

      await expect(service.getAllInvites()).resolves.toEqual([mockInvite]);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.findAllInvites.mockRejectedValue(new Error('DB down'));

      await expect(service.getAllInvites()).rejects.toThrow('Invites retrieval failed: DB down');
    });
  });

  describe('getInviteById()', () => {
    it('returns invite by id', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);

      await expect(service.getInviteById('ABC123')).resolves.toEqual(mockInvite);
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.findInviteById.mockRejectedValue(new Error('not found'));

      await expect(service.getInviteById('XYZ')).rejects.toThrow('Invite retrieval failed');
    });
  });

  describe('getActiveInviteById()', () => {
    it('returns active invite', async () => {
      mockRepo.findActiveInviteById.mockResolvedValue(mockInvite);

      await expect(service.getActiveInviteById('ABC123')).resolves.toEqual(mockInvite);
    });
  });

  // ─── markInviteAsUsed ────────────────────────────────────────────────────────

  describe('markInviteAsUsed()', () => {
    it('returns success when invite is marked as used', async () => {
      mockRepo.findActiveInviteById.mockResolvedValue(mockInvite);
      mockRepo.markInviteAsUsed.mockResolvedValue({ success: true });

      const result = await service.markInviteAsUsed('ABC123');

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('returns failure when invite not found or already used', async () => {
      mockRepo.findActiveInviteById.mockResolvedValue(null);

      const result = await service.markInviteAsUsed('ABC123');

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found or already used');
      expect(mockRepo.markInviteAsUsed).not.toHaveBeenCalled();
    });

    it('returns failure on exception (does not throw)', async () => {
      mockRepo.findActiveInviteById.mockRejectedValue(new Error('DB error'));

      const result = await service.markInviteAsUsed('ABC123');

      expect(result.success).toBe(false);
    });
  });

  // ─── deleteInvite ─────────────────────────────────────────────────────────────

  describe('deleteInvite()', () => {
    it('soft-deletes an existing invite', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);
      mockRepo.markInviteAsDeleted.mockResolvedValue({ success: true });

      const result = await service.deleteInvite('ABC123');

      expect(result.success).toBe(true);
      expect(mockRepo.markInviteAsDeleted).toHaveBeenCalledWith('ABC123');
    });

    it('returns failure when invite not found', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);

      const result = await service.deleteInvite('XYZ');

      expect(result.success).toBe(false);
      expect(mockRepo.markInviteAsDeleted).not.toHaveBeenCalled();
    });
  });

  // ─── permanentlyDeleteInvite ──────────────────────────────────────────────────

  describe('permanentlyDeleteInvite()', () => {
    it('hard-deletes an existing invite', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);
      mockRepo.deleteInvite.mockResolvedValue({ success: true });

      const result = await service.permanentlyDeleteInvite('ABC123');

      expect(result.success).toBe(true);
      expect(mockRepo.deleteInvite).toHaveBeenCalledWith('ABC123');
    });

    it('returns failure when invite not found', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);

      const result = await service.permanentlyDeleteInvite('XYZ');

      expect(result.success).toBe(false);
    });
  });

  // ─── validateInvite ───────────────────────────────────────────────────────────

  describe('validateInvite()', () => {
    it('returns valid when invite is active', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(true);
      expect(result.invite).toEqual(mockInvite);
    });

    it('returns invalid when invite not found', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);

      const result = await service.validateInvite('XYZ');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('not found');
    });

    it('returns invalid when invite has already been used', async () => {
      mockRepo.findInviteById.mockResolvedValue({ ...mockInvite, usedAt: new Date() });

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('already been used');
    });

    it('returns invalid when invite has been deleted', async () => {
      mockRepo.findInviteById.mockResolvedValue({ ...mockInvite, deletedAt: new Date() });

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('been deleted');
    });

    it('returns invalid on exception (does not throw)', async () => {
      mockRepo.findInviteById.mockRejectedValue(new Error('DB error'));

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(false);
    });
  });

  // ─── getInviteStatistics ──────────────────────────────────────────────────────

  describe('getInviteStatistics()', () => {
    it('returns stats with deleted computed as total - active - used', async () => {
      mockRepo.getInviteCount.mockResolvedValue(100);
      mockRepo.getActiveInviteCount.mockResolvedValue(60);
      mockRepo.getUsedInviteCount.mockResolvedValue(30);

      const result = await service.getInviteStatistics();

      expect(result).toEqual({ total: 100, active: 60, used: 30, deleted: 10 });
    });

    it('fetches the three counts in parallel', async () => {
      const callOrder: string[] = [];
      mockRepo.getInviteCount.mockImplementation(async () => { callOrder.push('total'); return 10; });
      mockRepo.getActiveInviteCount.mockImplementation(async () => { callOrder.push('active'); return 5; });
      mockRepo.getUsedInviteCount.mockImplementation(async () => { callOrder.push('used'); return 3; });

      await service.getInviteStatistics();

      // All three should be called (order may vary with Promise.all)
      expect(callOrder).toHaveLength(3);
      expect(callOrder).toContain('total');
      expect(callOrder).toContain('active');
      expect(callOrder).toContain('used');
    });

    it('wraps and re-throws repo error', async () => {
      mockRepo.getInviteCount.mockRejectedValue(new Error('timeout'));

      await expect(service.getInviteStatistics()).rejects.toThrow(
        'Statistics retrieval failed: timeout',
      );
    });
  });

  // ─── isInviteValid ────────────────────────────────────────────────────────────

  describe('isInviteValid()', () => {
    it('returns true when invite is valid', async () => {
      mockRepo.findInviteById.mockResolvedValue(mockInvite);

      await expect(service.isInviteValid('ABC123')).resolves.toBe(true);
    });

    it('returns false when invite is invalid', async () => {
      mockRepo.findInviteById.mockResolvedValue({ ...mockInvite, usedAt: new Date() });

      await expect(service.isInviteValid('ABC123')).resolves.toBe(false);
    });
  });

  // ─── generateInviteId ─────────────────────────────────────────────────────────

  describe('generateInviteId()', () => {
    it('returns a 6-character uppercase alphanumeric string', async () => {
      mockRepo.findInviteById.mockResolvedValue(null);

      const id = await service.generateInviteId();

      expect(id).toMatch(/^[A-Z0-9]{6}$/);
    });

    it('retries and returns a new id when generated id already exists', async () => {
      // First call returns existing invite (collision), second returns null (free)
      mockRepo.findInviteById
        .mockResolvedValueOnce(mockInvite)
        .mockResolvedValueOnce(null);

      const id = await service.generateInviteId();

      expect(mockRepo.findInviteById).toHaveBeenCalledTimes(2);
      expect(id).toMatch(/^[A-Z0-9]{6}$/);
    });
  });
});
