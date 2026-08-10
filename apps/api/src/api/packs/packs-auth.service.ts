import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PacksRepository } from './packs.repository';
import type { LauncherPrincipal } from './types/packs.types';

// Launcher sessions. The subject is a Boffmedia account — the launcher shell,
// the pack listing, entitlement and downloads are all Boffmedia-level facts, and
// none of them ever needed a Minecraft identity.
//
// Sessions are minted by the device-authorization flow (LauncherDeviceService).
// The Mojang `hasJoined` handshake that used to mint them lives on in
// MinecraftHandshakeService, repointed at the in-game MCEF page.

/** Launcher sessions are long-lived on purpose: re-approving on the website
 *  every hour is not something a player tolerates, and the session confers only
 *  what the account already has. */
const SESSION_TTL = '30d';

@Injectable()
export class PacksAuthService {
  constructor(
    private readonly jwt: JwtService,
    private readonly repo: PacksRepository,
  ) {}

  /**
   * The subject is the Boffmedia account id. Sessions minted before that were
   * subjected on a Minecraft UUID; those are rejected outright rather than
   * dual-accepted (decided 2026-08-09) — launching a Minecraft pack needs a live
   * Microsoft session regardless, so an old launcher session carries nothing
   * worth preserving, and the 409 `needs_newer_launcher` contract already forces
   * stragglers onto the new build.
   */
  signSession(principal: LauncherPrincipal, tokenVersion: number): string {
    // `typ` marks this as a launcher token rather than a website session. The
    // launcher guard checks it, so a website JWT cannot be replayed here and a
    // launcher JWT cannot be replayed against the website. `ltv` is the coarse
    // revocation counter the guard re-checks against the account's live value.
    return this.jwt.sign(
      {
        sub: principal.userId,
        username: principal.username,
        ...(principal.mcUuid ? { mcUuid: principal.mcUuid } : {}),
        typ: 'launcher',
        ltv: tokenVersion,
      },
      { expiresIn: SESSION_TTL },
    );
  }

  /** Invalidate every outstanding launcher session for an account by bumping the
   *  revocation counter. Existing tokens embed the old value and stop validating. */
  async revokeAllLauncherSessions(userId: number): Promise<void> {
    await this.repo.incrementLauncherTokenVersion(userId);
  }

  verifySession(token: string): LauncherPrincipal {
    let payload: {
      sub: number | string;
      username: string;
      mcUuid?: string;
      typ?: string;
      ltv?: number;
    };
    try {
      payload = this.jwt.verify(token);
    } catch {
      throw new UnauthorizedException('Sesión de launcher no válida');
    }

    if (payload.typ !== 'launcher') {
      throw new UnauthorizedException('Token de tipo incorrecto');
    }

    // A UUID subject is a pre-cutover session. Distinguished by shape rather
    // than a version claim: old tokens carry no claim to read.
    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException({
        error: 'needs_newer_launcher',
        message: 'Esta sesión es de una versión anterior del launcher',
      });
    }

    return {
      userId,
      username: payload.username,
      mcUuid: payload.mcUuid ?? null,
      tokenVersion: payload.ltv ?? 0,
    };
  }
}
