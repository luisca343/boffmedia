import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { extractBearer } from '@api/_utils/auth/server-token';
import type { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { PacksAuthService } from '../packs-auth.service';
import { PacksRepository } from '../packs.repository';
import type { DesktopPrincipal } from '../types/packs.types';

/**
 * Authenticates a route reachable from BOTH the website and the desktop app,
 * populating `req.user` either way so `@CurrentUser()` reads the same shape.
 *
 * The two credentials are different tokens with different rules, and neither
 * validates the other:
 *
 *  - **Website session** — `typ` absent (`access`) or `ingame`, revoked through
 *    the account's `sessionVersion` (`sv`). Handled by the normal jwt strategy.
 *  - **Desktop session** — `typ: 'launcher'`, revoked through a SEPARATE counter,
 *    `desktopTokenVersion` (`ltv`). Validating it through the website strategy
 *    would check `sv` and therefore miss a revoked app session entirely, which
 *    is why this cannot be done by adding `desktop` to `WEBSITE_TOKEN_TYPES`.
 *
 * Use it on tool routes the app writes to — the TCG Pocket collection, whose
 * edits the app queues offline and replays. The route must NOT also carry
 * `@RequireSession()`: that makes the GLOBAL `JwtAuthGuard` run first, and it
 * rejects a desktop token before this guard is ever reached. Same shape as the
 * trap documented on `DesktopAuthGuard`.
 */
@Injectable()
export class DesktopOrUserAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly desktopAuth: PacksAuthService,
    private readonly packsRepo: PacksRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const bearer = extractBearer(req);

    if (!bearer) {
      throw new UnauthorizedException(
        'This action requires a signed-in user or an app session.',
      );
    }

    // Website session first: it is the common case, and the jwt strategy rejects
    // a desktop token on its `typ` claim before it queries anything.
    try {
      return (await super.canActivate(context)) as boolean;
    } catch (websiteError) {
      let principal: DesktopPrincipal;
      try {
        principal = this.desktopAuth.verifySession(bearer);
      } catch {
        // Not a desktop session either — the website guard's answer is the
        // honest one, so it is what the caller gets.
        throw websiteError;
      }

      // Coarse revocation, exactly as DesktopAuthGuard does it: the token embeds
      // the account's counter at mint time, and a revoke-all bump makes every
      // older token stale.
      const current = await this.packsRepo.getDesktopTokenVersion(
        principal.userId,
      );
      if (current === null || current !== (principal.tokenVersion ?? 0)) {
        throw new UnauthorizedException({
          error: 'needs_newer_desktop',
          message: 'La sesión de la app ha sido revocada',
        });
      }

      // Roles ARE resolved for an app session, reversing an earlier stance
      // here ("an app session is an identity, not a set of powers"). That rule
      // was conservative rather than a boundary, and it made one whole class of
      // route impossible: reachable from both surfaces AND role-gated. The
      // desktop token carries no roles of its own — it is not a website session
      // — so they come from the database, exactly as DesktopAdminGuard already
      // resolves them for pack publishing. Nothing is granted that the same
      // human does not already hold on the website.
      const user: AuthPrincipal = {
        userId: principal.userId,
        username: principal.username,
        roles: await this.packsRepo.rolesOf(principal.userId),
        tokenType: 'launcher',
        ...(principal.mcUuid ? { mcUuid: principal.mcUuid } : {}),
      };
      (req as Request & { user?: AuthPrincipal }).user = user;
      return true;
    }
  }
}
