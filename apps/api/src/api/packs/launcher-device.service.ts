import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { LauncherDeviceRepository } from './launcher-device.repository';
import { PacksAuthService } from './packs-auth.service';
import { PacksRepository } from './packs.repository';
import { AUDIT } from './types/packs.types';

/** Long enough for a player to find the browser window, short enough that an
 *  abandoned code is not worth stealing. */
const CODE_TTL_MS = 10 * 60_000;

/** Digits and consonants only, in two groups. Removes O/0, I/1 and every vowel:
 *  the code is read off one screen and typed into another, and a code that can
 *  spell a word is a code someone will misread. */
const CODE_ALPHABET = '23456789BCDFGHJKLMNPQRSTVWXZ';

export interface DeviceAuthorization {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  intervalSeconds: number;
}

export type DevicePollResult =
  | { status: 'pending' }
  | { status: 'denied' }
  | { status: 'expired' }
  | {
      status: 'approved';
      token: string;
      user: { id: number; username: string; mcUuid: string | null };
    };

/**
 * The launcher's sign-in. The launcher asks for a code, the player approves it
 * on the website where they are already signed in, and the launcher polls until
 * a Boffmedia session appears.
 *
 * This replaces the Mojang `hasJoined` handshake as the way launcher sessions
 * are minted. That handshake proved a *Minecraft* identity, which the launcher
 * shell has no use for: packs, events, entitlements and downloads are all
 * Boffmedia-level facts, and requiring a paid Minecraft account to open an
 * emulator pack had no product justification left.
 */
@Injectable()
export class LauncherDeviceService {
  private readonly logger = new Logger(LauncherDeviceService.name);

  constructor(
    private readonly repo: LauncherDeviceRepository,
    private readonly auth: PacksAuthService,
    private readonly users: BoffMediaUsersFacadeService,
    private readonly packsRepo: PacksRepository,
  ) {}

  private newUserCode(): string {
    const pick = (n: number) =>
      Array.from(
        randomBytes(n),
        (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
      ).join('');
    return `${pick(4)}-${pick(4)}`;
  }

  /** A duplicate on the `user_code` unique index, so the insert can be retried
   *  with a fresh code instead of surfacing as a 500. */
  private isDuplicateUserCode(err: unknown): boolean {
    const code = (err as { code?: string; errno?: number } | null)?.code;
    const errno = (err as { errno?: number } | null)?.errno;
    return code === 'ER_DUP_ENTRY' || errno === 1062;
  }

  async start(
    clientLabel: string | null,
    verificationUri: string,
  ): Promise<DeviceAuthorization> {
    await this.repo.sweepExpired();

    const deviceCode = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);
    const label = clientLabel?.slice(0, 128) ?? null;

    // The user_code space is small (two 4-char groups) and the column is unique,
    // so a collision with a still-live code is rare but real. Regenerate a few
    // times before giving up rather than 500ing on the duplicate-key error.
    const MAX_ATTEMPTS = 5;
    let userCode = this.newUserCode();
    for (let attempt = 1; ; attempt++) {
      try {
        await this.repo.create({
          deviceCode,
          userCode,
          clientLabel: label,
          expiresAt,
        });
        break;
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS || !this.isDuplicateUserCode(err))
          throw err;
        userCode = this.newUserCode();
      }
    }

    return {
      deviceCode,
      userCode,
      // ?code= lets the approval page prefill: the launcher opens this URI
      // itself, so the player should not have to retype the code.
      verificationUri: `${verificationUri}?code=${encodeURIComponent(userCode)}`,
      expiresIn: Math.floor(CODE_TTL_MS / 1000),
      intervalSeconds: 3,
    };
  }

  async poll(deviceCode: string): Promise<DevicePollResult> {
    const row = await this.repo.findByDeviceCode(deviceCode);
    // An unknown code is an expired one: sweepExpired deletes past-TTL rows, so
    // "missing" and "expired" are the same fact seen at different times. Codes
    // are 64 random hex — answering 'expired' leaks nothing — and a 404 here
    // strands the launcher's pending state instead of ending it.
    if (!row) return { status: 'expired' };

    if (row.expiresAt.getTime() < Date.now()) return { status: 'expired' };
    if (row.status === 'denied') return { status: 'denied' };
    if (row.status !== 'approved' || row.userId == null) {
      return { status: 'pending' };
    }

    // Everything the token needs is gathered BEFORE the burn. Consuming first
    // and reading after made every read a single point of no return: the code
    // was already dead, so one failure did not fail the poll, it killed the
    // whole authorization — the next poll answered 'expired' and the player had
    // to start over with no idea why. (Seen for real: a missing
    // `launcher_token_version` column on an un-migrated database.)
    const user = await this.users.getUserById(row.userId);
    if (!user) throw new NotFoundException('Cuenta no encontrada');
    const tokenVersion =
      (await this.packsRepo.getLauncherTokenVersion(user.id)) ?? 0;

    // Burn it, last thing before minting: a replayed poll must not hand out a
    // second 30-day session for one approval.
    if (!(await this.repo.consume(deviceCode))) {
      return { status: 'expired' };
    }

    // The launcher_device_codes row is swept within minutes, so this is the only
    // durable record of who authorised a 30-day session, from which client — but
    // it is a record, not a gate. Losing the log entry must not cost the player
    // the session they just approved and can no longer re-approve.
    try {
      await this.packsRepo.audit(
        AUDIT.LAUNCHER_AUTH,
        null,
        user.uuid ?? null,
        { userId: user.id, clientLabel: row.clientLabel },
        user.id,
      );
    } catch (err) {
      this.logger.error(
        `No se pudo auditar la autorización del launcher para el usuario ${user.id}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }

    return {
      status: 'approved',
      token: this.auth.signSession(
        {
          userId: user.id,
          username: user.username,
          mcUuid: user.uuid ?? null,
        },
        tokenVersion,
      ),
      user: {
        id: user.id,
        username: user.username,
        mcUuid: user.uuid ?? null,
      },
    };
  }

  /** What the approval page shows before the player commits to anything. */
  async describe(userCode: string) {
    const row = await this.repo.findByUserCode(this.normalize(userCode));
    if (!row) throw new NotFoundException('Código no válido');
    if (row.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Este código ha caducado');
    }
    return {
      userCode: row.userCode,
      clientLabel: row.clientLabel,
      status: row.status,
      expiresAt: row.expiresAt,
    };
  }

  /**
   * Approving is what turns a free Boffmedia account into a launcher session,
   * so it requires a verified email — the anti-abuse trade for dropping the
   * Mojang paywall that used to gate this.
   */
  async approve(userCode: string, userId: number): Promise<void> {
    const user = await this.users.getUserById(userId);
    if (!user) throw new NotFoundException('Cuenta no encontrada');
    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Email not verified',
        userMessage:
          'Verifica tu correo antes de autorizar el launcher. Te hemos enviado un enlace al registrarte.',
      });
    }

    if (!(await this.repo.decide(this.normalize(userCode), 'approved', userId)))
      throw new BadRequestException('Este código ya no es válido');
  }

  /**
   * A pending request has no owner until someone approves it, so deny cannot be
   * bound to "the intended approver" — there isn't one yet. What we CAN do is
   * bind the actor: the denial records who performed it, and the route already
   * requires a FullSession (an in-game MCEF session cannot reach it) plus a
   * throttle, which is what closes casual abuse of a known user_code.
   */
  async deny(userCode: string, userId: number): Promise<void> {
    if (!(await this.repo.decide(this.normalize(userCode), 'denied', userId))) {
      throw new BadRequestException('Este código ya no es válido');
    }
    await this.packsRepo.audit(
      AUDIT.LAUNCHER_DENIED,
      null,
      null,
      { userId, userCode: this.normalize(userCode) },
      userId,
    );
  }

  /** Players paste the code with the dash, without it, or in lower case. */
  private normalize(userCode: string): string {
    const raw = userCode
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '');
    return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : userCode;
  }
}
