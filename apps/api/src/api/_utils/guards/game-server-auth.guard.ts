import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractBearer, matchesServerToken } from '../auth/server-token';

/**
 * For routes only the Minecraft server may call. Accepts exactly one credential:
 * the server's opaque Bearer token (`TERAS_API_TOKEN`). No JWT branch — no user
 * should reach these routes.
 *
 * Used for:
 * - Money routes (starbank: shop, trainerdefeat) that mint/move currency on the
 *   server's say-so with no ownership check — a user would allow any player to
 *   pay themselves.
 * - General server-only operations (users, caja, dungeons, karts, etc.) where
 *   only the mod should perform administrative writes.
 *
 * Same credential as GameOrUserAuthGuard, different policy: one mechanism, two
 * levels of trust. This guard never accepts the MC_WORLD tripwire (browser-shipped
 * credential), which would compromise the money routes' security model.
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
