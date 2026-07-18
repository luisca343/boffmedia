import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { env } from '@/config/env';
import { extractBearer, matchesServerToken } from '../auth/server-token';

/**
 * For server-only money routes that predate the auth rollout and still have a
 * live legacy caller — the mod calls `shop`/`trainerdefeat` with `body.server`,
 * not (yet) a Bearer (see STARBANK.md §2). These mint/move money on the mod's
 * say-so and must **never** be reachable by a signed-in user: unlike `transfer`,
 * they carry no ownership check, so a JWT branch would let any player pay
 * themselves. That is why this is not `GameOrUserAuthGuard`.
 *
 * Accepts, in order:
 *  1. the mod's opaque Bearer (`TERAS_API_TOKEN`) — the durable credential;
 *  2. while `ENFORCE_MONEY_AUTH` is false only, the legacy `body.server ===
 *     MC_WORLD` tripwire, so the un-updated mod keeps working. `MC_WORLD` ships
 *     in the browser bundle and is not a secret, so this path grants no trust
 *     beyond the transition and closes the instant the flag flips.
 *
 * Migration mirrors `GameServerAuthGuard`'s end state: once the mod sends the
 * Bearer on these routes and `ENFORCE_MONEY_AUTH` is true, only credential 1
 * remains. Routes using this guard must be on the MinecraftMiddleware exclude
 * list so the guard is the sole authority (the middleware would 403 a
 * Bearer-only, no-`server` request before it reaches here).
 */
@Injectable()
export class GameServerTransitionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { serverAuthed?: boolean }>();

    const bearer = extractBearer(req);
    if (bearer && matchesServerToken(bearer)) {
      req.serverAuthed = true;
      return true;
    }

    if (
      !env.ENFORCE_MONEY_AUTH &&
      (req.body as { server?: string } | undefined)?.server === env.MC_WORLD
    ) {
      // Transitional tripwire: no identity, so ownership is not enforced — which
      // is fine here because these routes act only on the mod's behalf.
      return true;
    }

    throw new UnauthorizedException(
      'This route requires a valid server token.',
    );
  }
}
