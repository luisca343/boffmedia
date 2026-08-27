import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * The app-wide rate limit, registered as an `APP_GUARD` after `JwtAuthGuard` so
 * `req.user` is already populated and can be used as the key.
 *
 * **Keyed on the account, not the IP, and that is not a preference — an IP key
 * would not work here at all.** The web app proxies its API calls through its
 * own Next.js server, so almost every request arrives from that one address and
 * `trust proxy` is not enabled, which means `req.ip` is the proxy's socket
 * address rather than the visitor's. An IP-keyed global limit would therefore
 * put every signed-in user into a single shared bucket and throttle the entire
 * site as one caller. (See `AuthThrottlerGuard`, which reached the same
 * conclusion for the auth routes and keys on the submitted identifier.)
 *
 * Two categories are skipped:
 *
 *  - **Server-to-server traffic from the Minecraft mod** (`req.serverAuthed`).
 *    It is one trusted caller with legitimately high volume, authenticated by
 *    the shared `TERAS_API_TOKEN`; shaping it with a per-caller limit would
 *    throttle the whole game server.
 *  - **Anonymous requests.** With no account to key on they would all collapse
 *    into the proxy-IP bucket described above, so a global limit here would be
 *    the very outage it is meant to prevent. Public routes that actually need
 *    limiting carry an explicit `@Throttle` instead — auth, invite redemption,
 *    suggestions, and the expensive tool aggregations. Enabling `trust proxy`
 *    (and trusting `X-Forwarded-For` from the known proxy only) would let this
 *    guard cover anonymous traffic too; that is a deployment decision, not one
 *    to make silently here.
 */
@Injectable()
export class GlobalThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const req = context.switchToHttp().getRequest<{
      serverAuthed?: boolean;
      user?: { userId?: number };
    }>();

    if (req.serverAuthed) return true;

    // No account to key on — see the class comment.
    return typeof req.user?.userId !== 'number';
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `user:${req.user?.userId}`;
  }
}
