import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import { RegistrationService } from './registration.service';
import { InviteManagementService } from './invite-management.service';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { UsersFacadeService } from '@api/smartrotom/users/users.facade.service';

jest.mock('@/_utils/stringUtils', () => ({
  shortToLongUUID: jest.fn().mockReturnValue('full-uuid-1234-5678-abcd'),
}));

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

const mockInviteService = {
  validateInvite: jest.fn(),
  markInviteAsUsed: jest.fn(),
};

const mockBoffMediaUsers = {
  createMinecraftUser: jest.fn(),
};

const mockSmartRotomUsers = {};

const validRegistration = {
  username: 'TrainerAsh',
  mc_username: 'Ash_MC',
  email: 'ash@pokemon.com',
  password: 'Pikach00!',
};

const mockMojangResponse = {
  ok: true,
  json: jest.fn().mockResolvedValue({ id: 'short-mc-uuid', name: 'Ash_MC' }),
};

const mockCreationResult = {
  boffMediaUser: { id: 1, username: 'TrainerAsh' },
  smartRotomUser: { id: 10 },
  starbankAccounts: [{ id: 1 }],
  isNewBoffMediaUser: true,
  isNewSmartRotomUser: true,
};

describe('RegistrationService', () => {
  let service: RegistrationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn().mockResolvedValue(mockMojangResponse);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: Logger, useValue: mockLogger },
        { provide: InviteManagementService, useValue: mockInviteService },
        { provide: BoffMediaUsersFacadeService, useValue: mockBoffMediaUsers },
        { provide: UsersFacadeService, useValue: mockSmartRotomUsers },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── registerUser ─────────────────────────────────────────────────────────────

  describe('registerUser()', () => {
    beforeEach(() => {
      mockInviteService.validateInvite.mockResolvedValue({ valid: true, invite: {} });
      mockBoffMediaUsers.createMinecraftUser.mockResolvedValue(mockCreationResult);
      mockInviteService.markInviteAsUsed.mockResolvedValue({ success: true });
    });

    it('returns success and user data on happy path', async () => {
      const result = await service.registerUser('ABC123', validRegistration);

      expect(result.success).toBe(true);
      expect(result.user!.username).toBe('TrainerAsh');
      expect(result.user!.email).toBe('ash@pokemon.com');
    });

    it('validates invite before proceeding', async () => {
      await service.registerUser('ABC123', validRegistration);

      expect(mockInviteService.validateInvite).toHaveBeenCalledWith('ABC123');
    });

    it('calls Mojang API to validate Minecraft username', async () => {
      await service.registerUser('ABC123', validRegistration);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Ash_MC'),
      );
    });

    it('creates user with full Minecraft data including converted UUID', async () => {
      await service.registerUser('ABC123', validRegistration);

      expect(mockBoffMediaUsers.createMinecraftUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'TrainerAsh',
          email: 'ash@pokemon.com',
          minecraft: expect.objectContaining({
            uuid: 'full-uuid-1234-5678-abcd',
            username: 'Ash_MC',
          }),
        }),
      );
    });

    it('marks invite as used after successful registration', async () => {
      await service.registerUser('ABC123', validRegistration);

      expect(mockInviteService.markInviteAsUsed).toHaveBeenCalledWith('ABC123');
    });

    it('returns INVALID_INVITE error when invite is not valid', async () => {
      mockInviteService.validateInvite.mockResolvedValue({
        valid: false,
        message: 'Invite has already been used',
      });

      const result = await service.registerUser('USED', validRegistration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_INVITE');
      expect(mockBoffMediaUsers.createMinecraftUser).not.toHaveBeenCalled();
    });

    it('returns INVALID_MINECRAFT_USERNAME when Mojang API returns non-ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 404 });

      const result = await service.registerUser('ABC123', validRegistration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_MINECRAFT_USERNAME');
    });

    it('returns INVALID_MINECRAFT_USERNAME when Mojang response is missing id/name', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ id: null, name: null }),
      });

      const result = await service.registerUser('ABC123', validRegistration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('INVALID_MINECRAFT_USERNAME');
    });

    it('returns REGISTRATION_ERROR on unexpected exception (does not throw)', async () => {
      mockBoffMediaUsers.createMinecraftUser.mockRejectedValue(new Error('DB crash'));

      const result = await service.registerUser('ABC123', validRegistration);

      expect(result.success).toBe(false);
      expect(result.error).toBe('REGISTRATION_ERROR');
    });

    it('continues and succeeds even when markInviteAsUsed fails', async () => {
      mockInviteService.markInviteAsUsed.mockResolvedValue({ success: false, message: 'already used' });

      const result = await service.registerUser('ABC123', validRegistration);

      expect(result.success).toBe(true);
    });
  });

  // ─── validateRegistrationData ─────────────────────────────────────────────────

  describe('validateRegistrationData()', () => {
    const valid = {
      username: 'TrainerAsh',
      mc_username: 'Ash_MC',
      email: 'ash@pokemon.com',
      password: 'Pikach00!',
    };

    it('returns valid for correct data', async () => {
      const result = await service.validateRegistrationData(valid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects username shorter than 3 characters', async () => {
      const result = await service.validateRegistrationData({ ...valid, username: 'ab' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username must be at least 3 characters long');
    });

    it('rejects username longer than 32 characters', async () => {
      const result = await service.validateRegistrationData({ ...valid, username: 'a'.repeat(33) });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username must be less than 32 characters');
    });

    it('rejects invalid email format', async () => {
      const result = await service.validateRegistrationData({ ...valid, email: 'not-an-email' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('rejects password shorter than 6 characters', async () => {
      const result = await service.validateRegistrationData({ ...valid, password: '12345' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 6 characters long');
    });

    it('rejects Minecraft username shorter than 3 characters', async () => {
      const result = await service.validateRegistrationData({ ...valid, mc_username: 'ab' });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minecraft username must be at least 3 characters long');
    });

    it('rejects Minecraft username longer than 16 characters', async () => {
      const result = await service.validateRegistrationData({ ...valid, mc_username: 'a'.repeat(17) });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Minecraft username must be less than 16 characters');
    });

    it('accumulates multiple errors at once', async () => {
      const result = await service.validateRegistrationData({
        username: 'ab',
        mc_username: 'x',
        email: 'bad',
        password: '123',
      });

      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  // ─── canRegisterWithInvite ────────────────────────────────────────────────────

  describe('canRegisterWithInvite()', () => {
    it('returns canRegister=true when invite is valid', async () => {
      mockInviteService.validateInvite.mockResolvedValue({ valid: true });

      const result = await service.canRegisterWithInvite('ABC123');

      expect(result.canRegister).toBe(true);
    });

    it('returns canRegister=false with message when invite is invalid', async () => {
      mockInviteService.validateInvite.mockResolvedValue({
        valid: false,
        message: 'Invite has been deleted',
      });

      const result = await service.canRegisterWithInvite('DEL001');

      expect(result.canRegister).toBe(false);
      expect(result.message).toBe('Invite has been deleted');
    });

    it('returns canRegister=false on exception (does not throw)', async () => {
      mockInviteService.validateInvite.mockRejectedValue(new Error('timeout'));

      const result = await service.canRegisterWithInvite('ERR001');

      expect(result.canRegister).toBe(false);
    });
  });
});
