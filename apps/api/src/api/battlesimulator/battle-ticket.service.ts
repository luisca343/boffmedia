import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'node:crypto';

/**
 * Short-lived tickets that let a websocket prove who is on the other end.
 *
 * The gateways had no authentication of any kind: identity was whatever
 * `clientId` the client sent in `register`, so anyone could claim to be anyone,
 * take over another player's room on reconnect, or read their battle. This is
 * what replaces that.
 *
 * WHY A SEPARATE TOKEN rather than sending the session over the socket:
 *
 *  - The desktop app CANNOT send its session. The launcher token lives in the
 *    OS keyring and is attached by the Rust proxy to HTTP calls; JavaScript in
 *    the renderer never sees it, by design. Minting a ticket over the ordinary
 *    authenticated HTTP path is what lets the app open a socket at all without
 *    a new Rust command or a token in the renderer.
 *  - `identifySocket` (the SmartRotom chat precedent) deliberately REFUSES
 *    launcher tokens, on the grounds that a launcher session is not a website
 *    session. That rule is right, and a ticket respects it: it is minted only
 *    behind a guard that has already accepted one credential or the other, and
 *    it authorises exactly one thing — opening a battle socket.
 *  - 60 seconds, single purpose, `jti` for traceability. A ticket that leaks is
 *    worth a minute of one namespace, not an account.
 */

/** How long a freshly minted ticket stays usable. */
export const BATTLE_TICKET_TTL_SECONDS = 60;

/** The `typ` claim. One secret signs every Boffmedia JWT, so this is the only
 *  thing stopping a ticket being replayed as a session, or the reverse. */
export const BATTLE_TICKET_TYPE = 'battle-ticket';

export interface BattlePrincipal {
  /** Boffmedia account id — the identity battlesim rows are owned by. */
  userId: number;
  /** Display name, for the battle log and the replay. */
  name: string;
}

@Injectable()
export class BattleTicketService {
  constructor(private readonly jwt: JwtService) {}

  /** Mints a ticket for an already-authenticated caller. */
  issue(principal: BattlePrincipal): { ticket: string; expiresIn: number } {
    const ticket = this.jwt.sign(
      {
        sub: principal.userId,
        name: principal.name,
        typ: BATTLE_TICKET_TYPE,
        jti: randomUUID(),
      },
      { expiresIn: BATTLE_TICKET_TTL_SECONDS },
    );
    return { ticket, expiresIn: BATTLE_TICKET_TTL_SECONDS };
  }

  /**
   * Verifies a ticket presented on a socket handshake.
   *
   * Throws rather than returning null: every caller is a connection gate, and
   * the one thing none of them may do is carry on without an identity.
   */
  verify(ticket: string): BattlePrincipal {
    let payload: { sub?: number | string; name?: string; typ?: string };
    try {
      payload = this.jwt.verify(ticket);
    } catch {
      // Expired is by far the common case (tickets last a minute and a
      // reconnect may outlive one), and the client's answer to both is the
      // same: fetch a new ticket. So they are not distinguished here.
      throw new UnauthorizedException('Ticket de combate no válido o caducado');
    }

    if (payload.typ !== BATTLE_TICKET_TYPE) {
      throw new UnauthorizedException('Token de tipo incorrecto');
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Ticket de combate sin sujeto válido');
    }

    return { userId, name: payload.name || `Player ${userId}` };
  }
}
