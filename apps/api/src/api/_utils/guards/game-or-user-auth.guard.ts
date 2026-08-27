import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { extractBearer, matchesServerToken } from '../auth/server-token';

/**
 * Authenticates money/admin routes that are hit from two very different
 * callers, both over `Authorization: Bearer`:
 *
 *  - The **web app** on behalf of a signed-in user → a Bearer **JWT**. On this
 *    path `req.user` is populated and downstream code MUST enforce ownership (a
 *    user may only move their own account's money).
 *  - The **Minecraft mod**, server-to-server → its **opaque** `apiToken`
 *    (`TerasConfig.apiToken`), matched against `TERAS_API_TOKEN`. On this path
 *    `req.serverAuthed` is set and ownership checks are skipped (trusted).
 *
 * The mod's token is checked *before* JWT verification because it is not a JWT:
 * passport would reject it outright. Bearer is the only server credential — do
 * not reintroduce a header-based one.
 */
@Injectable()
export class GameOrUserAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { serverAuthed?: boolean }>();

    const bearer = extractBearer(req);

    // 1. Server-to-server: the mod's opaque token. Must precede the JWT branch —
    // it is not a JWT, so passport would reject it.
    if (bearer && matchesServerToken(bearer)) {
      req.serverAuthed = true;
      return true;
    }

    // 2. A signed-in web user: whenever a Bearer token is present, evaluate it
    // so `req.user` (and thus ownership enforcement) applies. A present-but-invalid
    // token is always rejected; a missing token falls through to the final rejection.
    if (req.headers['authorization']) {
      try {
        return (await super.canActivate(context)) as boolean;
      } catch {
        throw new UnauthorizedException('Invalid or expired session token.');
      }
    }

    // 3. No credential.
    throw new UnauthorizedException(
      'This action requires a signed-in user or a valid server token.',
    );
  }
}
