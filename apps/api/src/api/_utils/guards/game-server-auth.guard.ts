import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractBearer, matchesServerToken } from '../auth/server-token';

/**
 * For routes only the Minecraft mod may call. Accepts exactly one credential:
 * the mod's opaque Bearer (`TERAS_API_TOKEN`). No JWT branch — no user should
 * reach these — and **no `body.server` tripwire**.
 *
 * That last point is the reason this exists rather than reusing
 * `GameOrUserAuthGuard`. That guard still honours `body.server === MC_WORLD`
 * while `ENFORCE_MONEY_AUTH` is false — a transitional concession so routes that
 * predate the auth rollout keep working. `MC_WORLD` ships in the browser bundle,
 * so on a route that *spends*, inheriting that fallback would let any stranger
 * burn a player's rewards with one request. A new route has no legacy caller to
 * protect and must never take that path.
 *
 * Same credential as GameOrUserAuthGuard, different policy: one mechanism, two
 * levels of trust.
 */
@Injectable()
export class GameServerAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { serverAuthed?: boolean }>();

    const bearer = extractBearer(req);
    if (bearer && matchesServerToken(bearer)) {
      req.serverAuthed = true;
      return true;
    }

    throw new UnauthorizedException(
      'This route requires a valid server token.',
    );
  }
}
