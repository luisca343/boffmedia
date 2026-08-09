import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { BoffMediaUsersFacadeService } from '@api/boffmedia/users/users.facade.service';
import { LauncherDeviceRepository } from './launcher-device.repository';
import { PacksAuthService } from './packs-auth.service';

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
  constructor(
    private readonly repo: LauncherDeviceRepository,
    private readonly auth: PacksAuthService,
    private readonly users: BoffMediaUsersFacadeService,
  ) {}

  private newUserCode(): string {
    const pick = (n: number) =>
      Array.from(
        randomBytes(n),
        (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
      ).join('');
    return `${pick(4)}-${pick(4)}`;
  }

  async start(
    clientLabel: string | null,
    verificationUri: string,
  ): Promise<DeviceAuthorization> {
    await this.repo.sweepExpired();

    const deviceCode = randomBytes(32).toString('hex');
    const userCode = this.newUserCode();
    const expiresAt = new Date(Date.now() + CODE_TTL_MS);

    await this.repo.create({
      deviceCode,
      userCode,
      clientLabel: clientLabel?.slice(0, 128) ?? null,
      expiresAt,
    });

    return {
      deviceCode,
      userCode,
      verificationUri,
      expiresIn: Math.floor(CODE_TTL_MS / 1000),
      intervalSeconds: 3,
    };
  }

  async poll(deviceCode: string): Promise<DevicePollResult> {
    const row = await this.repo.findByDeviceCode(deviceCode);
    if (!row) throw new NotFoundException('Solicitud desconocida');

    if (row.expiresAt.getTime() < Date.now()) return { status: 'expired' };
    if (row.status === 'denied') return { status: 'denied' };
    if (row.status !== 'approved' || row.userId == null) {
      return { status: 'pending' };
    }

    // Burn it before minting: a replayed poll must not hand out a second
    // 30-day session for one approval.
    if (!(await this.repo.consume(deviceCode))) {
      return { status: 'expired' };
    }

    const user = await this.users.getUserById(row.userId);
    if (!user) throw new NotFoundException('Cuenta no encontrada');

    return {
      status: 'approved',
      token: this.auth.signSession({
        userId: user.id,
        username: user.username,
        mcUuid: user.uuid ?? null,
      }),
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

  async deny(userCode: string): Promise<void> {
    if (!(await this.repo.decide(this.normalize(userCode), 'denied', null))) {
      throw new BadRequestException('Este código ya no es válido');
    }
  }

  /** Players paste the code with the dash, without it, or in lower case. */
  private normalize(userCode: string): string {
    const raw = userCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : userCode;
  }
}
