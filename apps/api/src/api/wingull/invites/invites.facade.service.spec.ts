import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { InvitesFacadeService } from './invites.facade.service';
import { InviteManagementService } from './services/invite-management.service';
import { RegistrationService } from './services/registration.service';

const mockInviteManagement = {
  generateInviteId: jest.fn(),
  createInvite: jest.fn(),
  getAllInvites: jest.fn(),
  getInviteById: jest.fn(),
  getActiveInviteById: jest.fn(),
  deleteInvite: jest.fn(),
  permanentlyDeleteInvite: jest.fn(),
  validateInvite: jest.fn(),
  getInviteStatistics: jest.fn(),
  getInvitesByUser: jest.fn(),
  getInvitesByUsername: jest.fn(),
};

const mockRegistration = {
  validateRegistrationData: jest.fn(),
  registerUser: jest.fn(),
  canRegisterWithInvite: jest.fn(),
};

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockInvite = { id: 'ABC123', uuid: 'user-uuid', username: 'TrainerAsh' } as any;

describe('InvitesFacadeService', () => {
  let service: InvitesFacadeService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitesFacadeService,
        { provide: Logger, useValue: mockLogger },
        { provide: InviteManagementService, useValue: mockInviteManagement },
        { provide: RegistrationService, useValue: mockRegistration },
      ],
    }).compile();

    service = module.get<InvitesFacadeService>(InvitesFacadeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── createInvite ─────────────────────────────────────────────────────────────

  describe('createInvite()', () => {
    it('generates id and delegates creation', async () => {
      mockInviteManagement.generateInviteId.mockResolvedValue('XYZ789');
      mockInviteManagement.createInvite.mockResolvedValue({ success: true, invite: mockInvite });

      const result = await service.createInvite('user-uuid', 'TrainerAsh');

      expect(result.success).toBe(true);
      expect(mockInviteManagement.createInvite).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'XYZ789', uuid: 'user-uuid', username: 'TrainerAsh' }),
      );
    });

    it('returns failure on error (does not throw)', async () => {
      mockInviteManagement.generateInviteId.mockRejectedValue(new Error('collision'));

      const result = await service.createInvite('uuid', 'user');

      expect(result.success).toBe(false);
      expect(result.message).toContain('collision');
    });
  });

  // ─── getAllInvites ────────────────────────────────────────────────────────────

  describe('getAllInvites()', () => {
    it('returns all invites from management service', async () => {
      mockInviteManagement.getAllInvites.mockResolvedValue([mockInvite]);

      await expect(service.getAllInvites()).resolves.toEqual([mockInvite]);
    });

    it('wraps and re-throws on error', async () => {
      mockInviteManagement.getAllInvites.mockRejectedValue(new Error('DB down'));

      await expect(service.getAllInvites()).rejects.toThrow('Failed to retrieve invites');
    });
  });

  // ─── getInviteById ────────────────────────────────────────────────────────────

  describe('getInviteById()', () => {
    it('delegates to management service', async () => {
      mockInviteManagement.getInviteById.mockResolvedValue(mockInvite);

      await expect(service.getInviteById('ABC123')).resolves.toEqual(mockInvite);
    });
  });

  // ─── deleteInvite ─────────────────────────────────────────────────────────────

  describe('deleteInvite()', () => {
    it('returns success when soft-deleted', async () => {
      mockInviteManagement.deleteInvite.mockResolvedValue({ success: true });

      await expect(service.deleteInvite('ABC123')).resolves.toEqual({ success: true });
    });

    it('returns failure on error (does not throw)', async () => {
      mockInviteManagement.deleteInvite.mockRejectedValue(new Error('fail'));

      const result = await service.deleteInvite('ABC123');

      expect(result.success).toBe(false);
    });
  });

  // ─── registerWithInvite ───────────────────────────────────────────────────────

  describe('registerWithInvite()', () => {
    const regData = { username: 'Ash', mc_username: 'Ash_MC', email: 'ash@pokemon.com', password: 'Pikach00!' };

    it('validates data then delegates registration', async () => {
      mockRegistration.validateRegistrationData.mockResolvedValue({ valid: true, errors: [] });
      mockRegistration.registerUser.mockResolvedValue({ success: true, user: mockInvite });

      const result = await service.registerWithInvite('ABC123', regData);

      expect(result.success).toBe(true);
      expect(mockRegistration.registerUser).toHaveBeenCalledWith('ABC123', regData);
    });

    it('returns VALIDATION_ERROR when registration data is invalid', async () => {
      mockRegistration.validateRegistrationData.mockResolvedValue({
        valid: false,
        errors: ['Password must be at least 6 characters long'],
      });

      const result = await service.registerWithInvite('ABC123', regData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('VALIDATION_ERROR');
      expect(mockRegistration.registerUser).not.toHaveBeenCalled();
    });

    it('returns REGISTRATION_ERROR on unexpected exception (does not throw)', async () => {
      mockRegistration.validateRegistrationData.mockRejectedValue(new Error('crash'));

      const result = await service.registerWithInvite('ABC123', regData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_ERROR');
    });
  });

  // ─── canRegisterWithInvite ────────────────────────────────────────────────────

  describe('canRegisterWithInvite()', () => {
    it('returns eligibility from registration service', async () => {
      mockRegistration.canRegisterWithInvite.mockResolvedValue({ canRegister: true, message: '' });

      await expect(service.canRegisterWithInvite('ABC123')).resolves.toMatchObject({ canRegister: true });
    });

    it('returns canRegister=false on error (does not throw)', async () => {
      mockRegistration.canRegisterWithInvite.mockRejectedValue(new Error('fail'));

      const result = await service.canRegisterWithInvite('ABC123');

      expect(result.canRegister).toBe(false);
    });
  });

  // ─── validateInvite ───────────────────────────────────────────────────────────

  describe('validateInvite()', () => {
    it('delegates validation to management service', async () => {
      mockInviteManagement.validateInvite.mockResolvedValue({ valid: true, invite: mockInvite });

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(true);
    });

    it('returns valid=false on error (does not throw)', async () => {
      mockInviteManagement.validateInvite.mockRejectedValue(new Error('fail'));

      const result = await service.validateInvite('ABC123');

      expect(result.valid).toBe(false);
    });
  });

  // ─── getInviteStatistics ──────────────────────────────────────────────────────

  describe('getInviteStatistics()', () => {
    it('returns statistics from management service', async () => {
      const stats = { total: 100, active: 60, used: 30, deleted: 10 };
      mockInviteManagement.getInviteStatistics.mockResolvedValue(stats);

      await expect(service.getInviteStatistics()).resolves.toEqual(stats);
    });
  });

  // ─── getUserInvites ───────────────────────────────────────────────────────────

  describe('getUserInvites()', () => {
    it('returns invites by user uuid', async () => {
      mockInviteManagement.getInvitesByUser.mockResolvedValue([mockInvite]);

      await expect(service.getUserInvites('user-uuid')).resolves.toEqual([mockInvite]);
    });
  });

  describe('getUserInvitesByUsername()', () => {
    it('returns invites by username', async () => {
      mockInviteManagement.getInvitesByUsername.mockResolvedValue([mockInvite]);

      await expect(service.getUserInvitesByUsername('TrainerAsh')).resolves.toEqual([mockInvite]);
    });
  });
});
