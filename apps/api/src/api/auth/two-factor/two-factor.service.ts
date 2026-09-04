import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import {
  SecretKeyUnavailableError,
  openSecret,
  sealSecret,
  secretEncryptionAvailable,
} from '@api/_utils/crypto/secret-box';
import { TwoFactorRepository } from './two-factor.repository';

/** RFC 6238 defaults. Kept explicit so a library upgrade cannot move them under
 *  us — a changed step or digit count invalidates every enrolled authenticator
 *  at once, silently. */
const TOTP_STEP_SECONDS = 30;
const TOTP_DIGITS = 6;
/**
 * How many steps either side of "now" are accepted. One step is ~30 s of clock
 * skew in each direction, which is what an unsynchronised phone actually drifts;
 * widening it multiplies the codes valid at any instant, which is the entire
 * thing the second factor is trying to keep small.
 */
const TOTP_WINDOW = 1;

/** Ten codes of ten base32 characters, ~50 bits each. Enough that guessing is
 *  hopeless, few enough that a person will actually write them down. */
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10;
/** Crockford-ish: no I, L, O or U — the characters people mistranscribe. */
const BACKUP_ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/** What the authenticator app shows above the code. */
const TOTP_ISSUER = 'Boffmedia';

export interface EnrolmentStart {
  /** Base32 shared secret, for the "cannot scan the QR" path. */
  secret: string;
  /** The RFC 6238 / Key Uri Format provisioning URI (otpauth scheme). */
  otpauth_url: string;
  /** The same URI rendered as an inline SVG, so no client needs a QR library. */
  qr_svg: string;
}

/**
 * TOTP second factor for administrative accounts (RFC 6238).
 *
 * Scoped to admins on purpose: BOFF_ADMIN and ROTOM_ADMIN are the accounts whose
 * loss is a platform incident rather than a personal one, and forcing enrolment
 * is only defensible where it is genuinely mandatory. `holdsAdminRole` in
 * `roles.constants.ts` is the single place that decides who that is.
 *
 * This service never mints sessions — `AuthService` does. Keeping the dependency
 * one-way (AuthService reads TwoFactorRepository, TwoFactorService is read by
 * the controller) is what stops the two from becoming a circular-dependency knot.
 */
@Injectable()
export class TwoFactorService {
  constructor(private readonly repo: TwoFactorRepository) {
    authenticator.options = {
      step: TOTP_STEP_SECONDS,
      digits: TOTP_DIGITS,
      window: TOTP_WINDOW,
    };
  }

  async isEnrolled(userId: number): Promise<boolean> {
    return this.repo.isEnrolled(userId);
  }

  async remainingBackupCodes(userId: number): Promise<number> {
    return this.repo.countUnusedBackupCodes(userId);
  }

  /**
   * Hand out a fresh secret and park it as PENDING.
   *
   * Restarting is always allowed while nothing is confirmed — the usual reason
   * to call this twice is that the first QR was never scanned. It refuses once a
   * factor is live, because silently replacing a working authenticator is how an
   * account gets locked out by a stray click.
   */
  async startEnrolment(
    userId: number,
    accountLabel: string,
  ): Promise<EnrolmentStart> {
    if (!secretEncryptionAvailable()) {
      throw new ServiceUnavailableException(
        userError(
          ApiErrorCode.AUTH_TWO_FACTOR_UNAVAILABLE,
          'SECRET_ENCRYPTION_KEY is not configured',
        ),
      );
    }
    if (await this.repo.isEnrolled(userId)) {
      throw new ConflictException(
        userError(
          ApiErrorCode.AUTH_TWO_FACTOR_ALREADY_ENROLLED,
          'two-factor already enrolled',
        ),
      );
    }

    const secret = authenticator.generateSecret();
    try {
      await this.repo.putPendingSecret(userId, sealSecret(secret));
    } catch (error) {
      if (error instanceof SecretKeyUnavailableError) {
        throw new ServiceUnavailableException(
          userError(
            ApiErrorCode.AUTH_TWO_FACTOR_UNAVAILABLE,
            'SECRET_ENCRYPTION_KEY is not configured',
          ),
        );
      }
      throw error;
    }

    const otpauth = authenticator.keyuri(accountLabel, TOTP_ISSUER, secret);
    return {
      secret,
      otpauth_url: otpauth,
      // Rendered here rather than in the browser so no client — web today, the
      // desktop app tomorrow — has to carry a QR encoder for one screen.
      qr_svg: await QRCode.toString(otpauth, {
        type: 'svg',
        margin: 1,
        errorCorrectionLevel: 'M',
      }),
    };
  }

  /**
   * Prove the pending secret before it becomes the live factor, and hand back
   * the backup codes.
   *
   * The codes are returned in plaintext HERE AND NOWHERE ELSE — only their
   * SHA-256 hashes are stored, so a user who loses this screen regenerates
   * rather than recovers.
   */
  async confirmEnrolment(userId: number, code: string): Promise<string[]> {
    const row = await this.repo.find(userId);
    if (!row?.pendingSecret) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.AUTH_TWO_FACTOR_NOT_ENROLLED,
          'no enrolment in progress',
        ),
      );
    }

    const secret = openSecret(row.pendingSecret);
    const step = this.verifyStep(secret, code);
    if (step === null) {
      throw new UnauthorizedException(
        userError(ApiErrorCode.AUTH_TWO_FACTOR_INVALID_CODE, 'invalid code'),
      );
    }

    const codes = this.generateBackupCodes();
    await this.repo.confirmEnrolment(
      userId,
      row.pendingSecret,
      step,
      codes.map(hashBackupCode),
    );
    return codes;
  }

  async regenerateBackupCodes(userId: number): Promise<string[]> {
    if (!(await this.repo.isEnrolled(userId))) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.AUTH_TWO_FACTOR_NOT_ENROLLED,
          'two-factor is not enrolled',
        ),
      );
    }
    const codes = this.generateBackupCodes();
    await this.repo.replaceBackupCodes(userId, codes.map(hashBackupCode));
    return codes;
  }

  /**
   * The one check every 2FA-gated path funnels through: login completion,
   * step-up, everything.
   *
   * Accepts either a TOTP code or a backup code, and BOTH are single-use — the
   * TOTP through the `lastStep` latch, the backup code by being consumed. A
   * failure is always the same error whichever half rejected it: saying which
   * one was wrong tells an attacker which one to keep trying.
   */
  async assertSecondFactor(
    userId: number,
    input: { code?: string; backupCode?: string },
  ): Promise<void> {
    const row = await this.repo.find(userId);
    if (!row?.secret || !row.confirmedAt) {
      throw new BadRequestException(
        userError(
          ApiErrorCode.AUTH_TWO_FACTOR_NOT_ENROLLED,
          'two-factor is not enrolled',
        ),
      );
    }

    if (input.backupCode) {
      const wanted = hashBackupCode(input.backupCode);
      const rows = await this.repo.listUnusedBackupCodes(userId);
      const match = rows.find((r) => r.codeHash === wanted);
      if (match && (await this.repo.consumeBackupCode(match.id))) return;
      throw new UnauthorizedException(
        userError(ApiErrorCode.AUTH_TWO_FACTOR_INVALID_CODE, 'invalid code'),
      );
    }

    const step = input.code
      ? this.verifyStep(openSecret(row.secret), input.code)
      : null;
    // The step latch is the replay guard: a code stays arithmetically valid for
    // its whole 30-second window, so without this the same six digits work
    // twice — which is exactly what a phished or shoulder-surfed code needs.
    if (step === null || !(await this.repo.claimStep(userId, step))) {
      throw new UnauthorizedException(
        userError(ApiErrorCode.AUTH_TWO_FACTOR_INVALID_CODE, 'invalid code'),
      );
    }
  }

  /**
   * @returns the TOTP counter step the code belongs to, or null if it does not
   * verify. The step — not just a yes — is what the replay latch needs.
   */
  private verifyStep(secret: string, code: string): number | null {
    const cleaned = code.replace(/\s+/g, '');
    if (!/^\d{6}$/.test(cleaned)) return null;
    let delta: number | null | undefined;
    try {
      delta = authenticator.checkDelta(cleaned, secret);
    } catch {
      // A malformed secret must read as "wrong code", never as a 500 that tells
      // the caller something about the stored data.
      return null;
    }
    if (delta === null || delta === undefined) return null;
    return Math.floor(Date.now() / 1000 / TOTP_STEP_SECONDS) + delta;
  }

  private generateBackupCodes(): string[] {
    return Array.from({ length: BACKUP_CODE_COUNT }, () =>
      Array.from(
        { length: BACKUP_CODE_LENGTH },
        () => BACKUP_ALPHABET[randomInt(BACKUP_ALPHABET.length)],
      ).join(''),
    );
  }
}

/** Case- and dash-insensitive: the codes are shown grouped for transcription,
 *  and a user retyping one should not fail on presentation. */
export function hashBackupCode(code: string): string {
  return createHash('sha256')
    .update(code.replace(/[\s-]/g, '').toUpperCase())
    .digest('hex');
}
