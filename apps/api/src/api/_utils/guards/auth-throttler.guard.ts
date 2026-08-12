import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits auth actions per **account identifier** rather than per IP. The
 * web app proxies auth through its Next.js server, so the API only ever sees
 * that one server IP — an IP-keyed limit would throttle every user together and
 * couldn't isolate a single abused account. Keys on the `uuid`
 * (`/users/minecraft/link`, whose body identifies the player that way), else
 * the submitted `username` (login) or `email` (forgot-password /
 * resend-verification) so per-account guessing and email-bombing are capped
 * regardless of the proxy; falls back to IP when none is present.
 *
 * The `uuid` branch is safe to key on because every route that sends one sits
 * behind `GameServerAuthGuard` — an anonymous caller cannot pick the key and
 * rotate it to shed the limit.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const identifier =
      req.body?.uuid ?? req.body?.username ?? req.body?.email;
    if (typeof identifier === 'string' && identifier.length > 0) {
      return `auth:${identifier.toLowerCase()}`;
    }
    return req.ip;
  }
}
