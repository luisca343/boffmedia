import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import { TOKEN_TYPE, tokenTypeOf } from '@api/_utils/auth/token-types';

/**
 * Who a socket belongs to, established ONCE at connection time from a signed
 * token and never again from anything the client sends.
 *
 * Taking the uuid out of the `smartrotom:connection` payload instead would let
 * any client claim to be any player: presence, typing indicators and every call
 * signal become addressable by whoever asks.
 */
export interface SocketIdentity {
  userId: number;
  /** The linked Minecraft UUID — the key SmartRotom rows are owned by. Absent
   *  for an account that has never linked Minecraft, which cannot use the
   *  Rotom-phone surface at all. */
  mcUuid: string | null;
}

declare module 'socket.io' {
  interface Socket {
    identity?: SocketIdentity;
  }
}

/**
 * Reads the token from the handshake. `auth.token` is the socket.io-native
 * place for it; the query string is accepted because some embedded clients
 * (MCEF) cannot set handshake auth.
 */
export function tokenFromHandshake(client: Socket): string | null {
  const auth = client.handshake.auth as { token?: unknown } | undefined;
  if (typeof auth?.token === 'string' && auth.token) return auth.token;

  const query = client.handshake.query?.token;
  if (typeof query === 'string' && query) return query;

  const header = client.handshake.headers?.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

/**
 * Verifies the handshake token and returns the identity it proves, or null.
 *
 * Website and in-game sessions are both accepted: the Rotom phone runs inside
 * Minecraft on an `ingame` token, and refusing it would take the chat away from
 * exactly the surface it exists for. Refresh and launcher tokens are refused —
 * neither is a website session and replaying one here would be a way around
 * that distinction.
 */
export function identifySocket(
  jwt: JwtService,
  client: Socket,
): SocketIdentity | null {
  const token = tokenFromHandshake(client);
  if (!token) return null;

  try {
    const payload = jwt.verify<{
      sub?: number | string;
      mcUuid?: string;
      typ?: string;
    }>(token);

    const type = tokenTypeOf(payload);
    if (type !== TOKEN_TYPE.ACCESS && type !== TOKEN_TYPE.INGAME) return null;

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) return null;

    return { userId, mcUuid: payload.mcUuid ?? null };
  } catch {
    return null;
  }
}
