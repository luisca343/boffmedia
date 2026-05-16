import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordOptions {
  length?: number;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
  includeNumbers?: boolean;
  includeSymbols?: boolean;
  excludeSimilar?: boolean;
}

@Injectable()
export class PasswordService {
  private readonly saltRounds = 12;
  private readonly minLength = 8;
  private readonly maxLength = 128;

  // Character sets for password generation
  private readonly charsets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    similar: 'il1Lo0O', // Characters that look similar
  };

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    if (!password) {
      throw new Error('Password is required for hashing');
    }

    try {
      const salt = await bcrypt.genSalt(this.saltRounds);
      return bcrypt.hash(password, salt);
    } catch (error: any) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify a password against its hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    try {
      return bcrypt.compare(password, hash);
    } catch (error: any) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Validate password strength and requirements
   */
  validatePassword(password: string): PasswordValidationResult {
    const errors: string[] = [];
    let strengthScore = 0;

    // Check basic requirements
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors, strength: 'weak' };
    }

    if (password.length < this.minLength) {
      errors.push(
        `Password must be at least ${this.minLength} characters long`,
      );
    } else {
      strengthScore += 1;
    }

    if (password.length > this.maxLength) {
      errors.push(`Password must not exceed ${this.maxLength} characters`);
    }

    // Check character variety
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    if (!hasLowercase) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      strengthScore += 1;
    }

    if (!hasUppercase) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      strengthScore += 1;
    }

    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    } else {
      strengthScore += 1;
    }

    if (!hasSymbols) {
      errors.push('Password must contain at least one special character');
    } else {
      strengthScore += 1;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
      strengthScore -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password should not contain common patterns');
      strengthScore -= 1;
    }

    // Determine strength
    let strength: 'weak' | 'medium' | 'strong';
    if (strengthScore >= 4 && password.length >= 12) {
      strength = 'strong';
    } else if (strengthScore >= 3 && password.length >= 8) {
      strength = 'medium';
    } else {
      strength = 'weak';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength,
    };
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(options: PasswordOptions = {}): string {
    const {
      length = 16,
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSymbols = true,
      excludeSimilar = true,
    } = options;

    if (length < 4 || length > 256) {
      throw new Error('Password length must be between 4 and 256 characters');
    }

    let charset = '';
    const requiredChars: string[] = [];

    if (includeLowercase) {
      charset += this.charsets.lowercase;
      requiredChars.push(
        this.getRandomChar(this.charsets.lowercase, excludeSimilar),
      );
    }

    if (includeUppercase) {
      charset += this.charsets.uppercase;
      requiredChars.push(
        this.getRandomChar(this.charsets.uppercase, excludeSimilar),
      );
    }

    if (includeNumbers) {
      charset += this.charsets.numbers;
      requiredChars.push(
        this.getRandomChar(this.charsets.numbers, excludeSimilar),
      );
    }

    if (includeSymbols) {
      charset += this.charsets.symbols;
      requiredChars.push(
        this.getRandomChar(this.charsets.symbols, excludeSimilar),
      );
    }

    if (excludeSimilar) {
      charset = charset
        .split('')
        .filter((char) => !this.charsets.similar.includes(char))
        .join('');
    }

    if (charset.length === 0) {
      throw new Error('No valid characters available for password generation');
    }

    // Start with required characters to ensure all character types are included
    let password = requiredChars.join('');

    // Fill the rest with random characters
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(crypto.randomInt(0, charset.length));
    }

    // Shuffle the password to avoid predictable patterns
    return this.shuffleString(password);
  }

  /**
   * Generate a random password for OAuth users (less restrictive)
   */
  generateOAuthPassword(length: number = 24): string {
    return this.generateSecurePassword({
      length,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: false, // Avoid symbols for OAuth passwords
      excludeSimilar: true,
    });
  }

  /**
   * Check if password has been compromised (basic implementation)
   * In production, you might want to integrate with services like HaveIBeenPwned
   */
  async isPasswordCompromised(password: string): Promise<boolean> {
    // Basic check for very common passwords
    const commonPasswords = [
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
    ];

    return commonPasswords.includes(password.toLowerCase());
  }

  /**
   * Generate a password reset token
   */
  generateResetToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Token expires in 1 hour

    return { token, expires };
  }

  /**
   * Verify a password reset token format
   */
  isValidResetToken(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
  }

  /**
   * Calculate password entropy (bits of randomness)
   */
  calculatePasswordEntropy(password: string): number {
    let charsetSize = 0;

    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) charsetSize += 32;

    return Math.log2(Math.pow(charsetSize, password.length));
  }

  // Private helper methods
  private getRandomChar(charset: string, excludeSimilar: boolean): string {
    let validChars = charset;
    if (excludeSimilar) {
      validChars = charset
        .split('')
        .filter((char) => !this.charsets.similar.includes(char))
        .join('');
    }
    return validChars.charAt(crypto.randomInt(0, validChars.length));
  }

  private shuffleString(str: string): string {
    const array = str.split('');
    for (let i = array.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array.join('');
  }
}
