import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits authenticated actions per **user id** rather than per IP. The web
 * app proxies requests through its Next.js server, so the API only ever sees
 * that one server IP — an IP-keyed limit would throttle every user together.
 * Keys on the JWT-resolved `req.user.userId` (populated by JwtAuthGuard, which
 * must run first), falling back to IP when no user is present.
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return String(req.user?.userId ?? req.ip);
  }
}
