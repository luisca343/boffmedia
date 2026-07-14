import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { env } from '@/config/env';

/**
 * Authenticates money/admin routes that are hit from two very different
 * callers:
 *
 *  - The **web app** on behalf of a signed-in user → a Bearer JWT. On this path
 *    `req.user` is populated and downstream code MUST enforce ownership (a user
 *    may only move their own account's money).
 *  - The **Minecraft game server**, server-to-server → the shared secret in the
 *    `X-Server-Key` header (matched against `GAME_SERVER_SECRET`). On this path
 *    `req.serverAuthed` is set and ownership checks are skipped (trusted).
 *
 * Rollout: while `ENFORCE_MONEY_AUTH` is false (default), a request carrying the
 * legacy `body.server === MC_WORLD` tripwire is still allowed, so the existing
 * (un-updated) plugin and web keep working. Flip the flag to true once the
 * plugin ships `X-Server-Key` and the web sends its JWT — then only the two
 * real credentials are accepted. See MinecraftMiddleware (not a security
 * boundary) for why the tripwire alone is insufficient.
 */
@Injectable()
export class GameOrUserAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { serverAuthed?: boolean }>();

    // 1. Server-to-server: valid shared secret.
    const secret = env.GAME_SERVER_SECRET;
    const provided = req.headers['x-server-key'];
    if (secret && typeof provided === 'string' && provided === secret) {
      req.serverAuthed = true;
      return true;
    }

    // 2. A signed-in web user: whenever a Bearer token is present, evaluate it
    // so `req.user` (and thus ownership enforcement) applies immediately — even
    // before the rollout flag flips. A present-but-invalid token is always
    // rejected; a missing token falls through to the transitional tripwire.
    if (req.headers['authorization']) {
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        throw new UnauthorizedException('Invalid or expired session token.');
      }
    }

    // 3. Transitional: legacy tripwire, only while enforcement is off. Lets the
    // un-updated game plugin (and un-migrated web) keep working until the flag
    // flips. Grants no identity, so no ownership check runs on this path.
    if (
      !env.ENFORCE_MONEY_AUTH &&
      (req.body as { server?: string } | undefined)?.server === env.MC_WORLD
    ) {
      return true;
    }

    // 4. No credential.
    throw new UnauthorizedException(
      'This action requires a signed-in user or a valid server key.',
    );
  }
}
