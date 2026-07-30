import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { firstValueFrom } from 'rxjs';
import type { JoinChallenge, LauncherPrincipal } from './types/packs.types';

// HANDOFF §7.2 — proving a Minecraft UUID without ever touching a Microsoft or
// Minecraft token:
//
//   1. We issue a random serverId.
//   2. The launcher POSTs it to Mojang's session/minecraft/join with ITS token.
//   3. We ask Mojang hasJoined(username, serverId). A match proves the caller
//      controls that account, because only the account holder could have
//      completed step 2.
//
// This is the same handshake every vanilla server performs, which is why it is
// safe and why it needs no special Mojang permission.

const HAS_JOINED_URL =
  'https://sessionserver.mojang.com/session/minecraft/hasJoined';

/** Long enough for a human-free round trip, short enough that a leaked serverId
 *  is worthless. Mojang's own join records expire on a similar scale. */
const CHALLENGE_TTL_MS = 60_000;

/** Launcher sessions are long-lived on purpose: re-running the handshake needs
 *  a live Minecraft token, and forcing that hourly would mean re-authenticating
 *  with Microsoft far more often than a user tolerates. */
const SESSION_TTL = '30d';

interface PendingChallenge {
  expiresAt: number;
}

@Injectable()
export class PacksAuthService {
  private readonly logger = new Logger(PacksAuthService.name);

  /**
   * In-memory because a challenge lives for 60 seconds and the API runs as a
   * single container. If it is ever scaled horizontally this MUST move to the
   * database or Redis — otherwise a launcher that verifies against a different
   * instance than it challenged will fail, intermittently and confusingly.
   */
  private readonly pending = new Map<string, PendingChallenge>();

  constructor(
    private readonly http: HttpService,
    private readonly jwt: JwtService,
  ) {}

  /** Step 1 — hand out a serverId for the launcher to join against. */
  createChallenge(): JoinChallenge {
    this.sweep();
    // Mojang treats serverId as an opaque ASCII string; hex keeps it URL-safe.
    const serverId = randomBytes(16).toString('hex');
    this.pending.set(serverId, { expiresAt: Date.now() + CHALLENGE_TTL_MS });
    return { serverId, expiresInSeconds: CHALLENGE_TTL_MS / 1000 };
  }

  /**
   * Step 3 — verify and mint a session. Consumes the challenge whatever the
   * outcome, so a serverId can never be replayed.
   */
  async verify(username: string, serverId: string): Promise<LauncherPrincipal> {
    const challenge = this.pending.get(serverId);
    this.pending.delete(serverId);

    if (!challenge || challenge.expiresAt < Date.now()) {
      throw new UnauthorizedException('El desafío no existe o ha caducado');
    }

    const profile = await this.hasJoined(username, serverId);
    if (!profile) {
      throw new UnauthorizedException('Mojang no confirmó la sesión');
    }

    return profile;
  }

  signSession(principal: LauncherPrincipal): string {
    // `typ` marks this as a launcher token rather than a website session. The
    // launcher guard checks it, so a website JWT cannot be replayed here and a
    // launcher JWT cannot be replayed against the website.
    return this.jwt.sign(
      { sub: principal.uuid, username: principal.username, typ: 'launcher' },
      { expiresIn: SESSION_TTL },
    );
  }

  verifySession(token: string): LauncherPrincipal {
    try {
      const payload = this.jwt.verify<{
        sub: string;
        username: string;
        typ?: string;
      }>(token);
      if (payload.typ !== 'launcher') {
        throw new UnauthorizedException('Token de tipo incorrecto');
      }
      return { uuid: payload.sub, username: payload.username };
    } catch {
      throw new UnauthorizedException('Sesión de launcher no válida');
    }
  }

  private async hasJoined(
    username: string,
    serverId: string,
  ): Promise<LauncherPrincipal | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ id?: string; name?: string }>(HAS_JOINED_URL, {
          params: { username, serverId },
          timeout: 8000,
          // Mojang answers 204 with an empty body when the join is not found;
          // axios must not treat that as an error so we can report it cleanly.
          validateStatus: (status) => status === 200 || status === 204,
        }),
      );

      const id = response.data?.id;
      const name = response.data?.name;
      if (!id || !name) return null;

      return { uuid: this.dashUuid(id), username: name };
    } catch (error) {
      // A Mojang outage must not read as "bad credentials" in the logs, or
      // every incident looks like an auth bug.
      this.logger.error(
        `hasJoined falló para ${username}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  /** Mojang returns undashed UUIDs; `rotom_users.uuid` is char(36) dashed, and
   *  the two must match or every ACL lookup silently misses. */
  private dashUuid(raw: string): string {
    if (raw.includes('-')) return raw.toLowerCase();
    const h = raw.toLowerCase();
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  }

  private sweep(): void {
    const now = Date.now();
    for (const [key, value] of this.pending) {
      if (value.expiresAt < now) this.pending.delete(key);
    }
  }
}
