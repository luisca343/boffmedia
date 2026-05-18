import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Logger } from 'nestjs-pino';
import { PasswordService } from './password.service';

jest.mock('bcrypt');

const mockLogger = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        { provide: Logger, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ─── hashPassword ────────────────────────────────────────────────────────────

  describe('hashPassword()', () => {
    it('returns a hash string', async () => {
      (bcrypt.genSalt as jest.Mock).mockResolvedValue('$salt');
      (bcrypt.hash as jest.Mock).mockResolvedValue('$hashed');

      const result = await service.hashPassword('Secret1!');

      expect(result).toBe('$hashed');
      expect(bcrypt.genSalt).toHaveBeenCalledWith(12);
      expect(bcrypt.hash).toHaveBeenCalledWith('Secret1!', '$salt');
    });

    it('throws when password is empty', async () => {
      await expect(service.hashPassword('')).rejects.toThrow(
        'Password is required for hashing',
      );
    });

    it('throws when bcrypt fails', async () => {
      (bcrypt.genSalt as jest.Mock).mockRejectedValue(new Error('bcrypt error'));

      await expect(service.hashPassword('Secret1!')).rejects.toThrow(
        'Password hashing failed: bcrypt error',
      );
    });
  });

  // ─── verifyPassword ──────────────────────────────────────────────────────────

  describe('verifyPassword()', () => {
    it('returns true when password matches hash', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.verifyPassword('Secret1!', '$hashed');

      expect(result).toBe(true);
    });

    it('returns false when password does not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.verifyPassword('wrong', '$hashed');

      expect(result).toBe(false);
    });

    it('returns false when password is empty', async () => {
      const result = await service.verifyPassword('', '$hashed');
      expect(result).toBe(false);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('returns false when hash is empty', async () => {
      const result = await service.verifyPassword('Secret1!', '');
      expect(result).toBe(false);
    });

    it('returns false and logs when bcrypt throws', async () => {
      (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('compare fail'));

      const result = await service.verifyPassword('Secret1!', '$hashed');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });

});

  // ─── validatePassword ────────────────────────────────────────────────────────

  describe('validatePassword()', () => {
    it('returns invalid with errors for empty password', () => {
      const result = service.validatePassword('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password is required');
    });

    it('returns invalid when password is too short', () => {
      const result = service.validatePassword('Sh0rt!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must be at least 8 characters long',
      );
    });

    it('returns invalid when password exceeds max length', () => {
      const result = service.validatePassword('A1!' + 'a'.repeat(130));

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must not exceed 128 characters',
      );
    });

    it('returns invalid when missing lowercase', () => {
      const result = service.validatePassword('UPPERCASE1!ABCD');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one lowercase letter',
      );
    });

    it('returns invalid when missing uppercase', () => {
      const result = service.validatePassword('lowercase1!abcd');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter',
      );
    });

    it('returns invalid when missing numbers', () => {
      const result = service.validatePassword('NoNumbers!abcd');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one number',
      );
    });

    it('returns invalid when missing symbols', () => {
      const result = service.validatePassword('NoSymbols1abcd');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one special character',
      );
    });

    it('returns error for 3+ repeated consecutive characters', () => {
      const result = service.validatePassword('Aaaa1!test');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password should not contain repeated characters',
      );
    });

    it('returns error for common patterns', () => {
      const result = service.validatePassword('Password123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password should not contain common patterns',
      );
    });

    it('returns valid and strong for a good password', () => {
      const result = service.validatePassword('Tr@iner4sh2024!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe('strong');
    });

    it('returns medium strength for a decent 8-char password', () => {
      const result = service.validatePassword('Pika!1ab');

      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    it('returns weak strength for minimal character variety', () => {
      // Very short + limited variety — just enough to avoid individual errors but score low
      const result = service.validatePassword('aaaa');
      expect(result.strength).toBe('weak');
    });
  });

  // ─── generateSecurePassword ──────────────────────────────────────────────────

  describe('generateSecurePassword()', () => {
    it('generates a password of default length 16', () => {
      const password = service.generateSecurePassword();
      expect(password).toHaveLength(16);
    });

    it('generates a password of specified length', () => {
      const password = service.generateSecurePassword({ length: 20 });
      expect(password).toHaveLength(20);
    });

    it('throws for length below 4', () => {
      expect(() => service.generateSecurePassword({ length: 3 })).toThrow(
        'Password length must be between 4 and 256 characters',
      );
    });

    it('throws for length above 256', () => {
      expect(() => service.generateSecurePassword({ length: 257 })).toThrow(
        'Password length must be between 4 and 256 characters',
      );
    });

    it('throws when all character types are disabled', () => {
      expect(() =>
        service.generateSecurePassword({
          includeUppercase: false,
          includeLowercase: false,
          includeNumbers: false,
          includeSymbols: false,
        }),
      ).toThrow('No valid characters available for password generation');
    });

    it('excludes similar characters (il1Lo0O) when excludeSimilar is true', () => {
      const password = service.generateSecurePassword({
        length: 32,
        excludeSimilar: true,
      });
      expect(password).not.toMatch(/[il1Lo0O]/);
    });

    it('generates two distinct passwords on consecutive calls', () => {
      // With a 16-char password the chance of collision is astronomically low
      const p1 = service.generateSecurePassword();
      const p2 = service.generateSecurePassword();
      expect(p1).not.toBe(p2);
    });

    it('omits numbers when includeNumbers is false', () => {
      const password = service.generateSecurePassword({
        length: 32,
        includeNumbers: false,
        excludeSimilar: false,
      });
      expect(password).not.toMatch(/\d/);
    });
  });

  // ─── generateOAuthPassword ───────────────────────────────────────────────────

  describe('generateOAuthPassword()', () => {
    it('returns a string of default length 24', () => {
      const result = service.generateOAuthPassword();
      expect(typeof result).toBe('string');
      expect(result).toHaveLength(24);
    });

    it('returns a string of specified length', () => {
      const result = service.generateOAuthPassword(32);
      expect(result).toHaveLength(32);
    });

    it('does not include symbols', () => {
      const result = service.generateOAuthPassword(48);
      expect(result).not.toMatch(/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/);
    });
  });

  // ─── isPasswordCompromised ───────────────────────────────────────────────────

  describe('isPasswordCompromised()', () => {
    it.each([
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ])('returns true for common password "%s"', async (common) => {
      await expect(service.isPasswordCompromised(common)).resolves.toBe(true);
    });

    it('is case-insensitive', async () => {
      await expect(service.isPasswordCompromised('PASSWORD')).resolves.toBe(
        true,
      );
    });

    it('returns false for a safe password', async () => {
      await expect(
        service.isPasswordCompromised('Tr@iner4sh-2024!'),
      ).resolves.toBe(false);
    });
  });

  // ─── generateResetToken ──────────────────────────────────────────────────────

  describe('generateResetToken()', () => {
    it('returns a 64-character hex token', () => {
      const { token } = service.generateResetToken();
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it('returns an expiry ~1 hour in the future', () => {
      const before = Date.now();
      const { expires } = service.generateResetToken();
      const after = Date.now();

      const expectedMs = 60 * 60 * 1000;
      expect(expires.getTime() - before).toBeGreaterThanOrEqual(
        expectedMs - 1000,
      );
      expect(expires.getTime() - after).toBeLessThanOrEqual(expectedMs + 1000);
    });

    it('returns unique tokens on consecutive calls', () => {
      const { token: t1 } = service.generateResetToken();
      const { token: t2 } = service.generateResetToken();
      expect(t1).not.toBe(t2);
    });
  });

  // ─── isValidResetToken ───────────────────────────────────────────────────────

  describe('isValidResetToken()', () => {
    it('returns true for a valid 64-char hex token', () => {
      const { token } = service.generateResetToken();
      expect(service.isValidResetToken(token)).toBe(true);
    });

    it('returns false for an empty string', () => {
      expect(service.isValidResetToken('')).toBe(false);
    });

    it('returns false for a token that is too short', () => {
      expect(service.isValidResetToken('abc123')).toBe(false);
    });

    it('returns false for a token with non-hex characters', () => {
      const invalid = 'g'.repeat(64);
      expect(service.isValidResetToken(invalid)).toBe(false);
    });

    it('returns false for a token that is too long (65 chars)', () => {
      const tooLong = 'a'.repeat(65);
      expect(service.isValidResetToken(tooLong)).toBe(false);
    });
  });

  // ─── calculatePasswordEntropy ────────────────────────────────────────────────

  describe('calculatePasswordEntropy()', () => {
    it('returns 0 for an empty password', () => {
      expect(service.calculatePasswordEntropy('')).toBe(0);
    });

    it('returns higher entropy for a longer password', () => {
      const short = service.calculatePasswordEntropy('abc');
      const long = service.calculatePasswordEntropy('abcdefghijklmnop');
      expect(long).toBeGreaterThan(short);
    });

    it('returns higher entropy for more character types', () => {
      const lowercase = service.calculatePasswordEntropy('abcdefgh');
      const mixed = service.calculatePasswordEntropy('Abcdefg1');
      expect(mixed).toBeGreaterThan(lowercase);
    });

    it('returns higher entropy when symbols are included', () => {
      const noSymbols = service.calculatePasswordEntropy('Abcdef1g');
      const withSymbols = service.calculatePasswordEntropy('Abcdef1!');
      expect(withSymbols).toBeGreaterThan(noSymbols);
    });

    it('returns a finite positive number for a valid password', () => {
      const entropy = service.calculatePasswordEntropy('Tr@iner1');
      expect(isFinite(entropy)).toBe(true);
      expect(entropy).toBeGreaterThan(0);
    });
  });
});
