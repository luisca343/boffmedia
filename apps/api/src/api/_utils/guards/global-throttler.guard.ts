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
 *    suggestions, and the expensive tool aggregations.
 *
 * **Do not "fix" the anonymous gap by enabling `trust proxy`.** The API is
 * reachable directly, not only through the Next server, so `X-Forwarded-For` is
 * caller-controlled: trusting it would let anyone mint a fresh throttle key per
 * request and bypass every limit here — including the explicit `@Throttle`
 * routes above, which today are the only thing standing in front of auth. That
 * is strictly worse than the present gap, where anonymous traffic is unlimited
 * but no key can be forged. The order matters: restrict ingress so the API is
 * only reachable through the proxy, and only then trust the header from that
 * one address.
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
