import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Rate-limits the mid-sign-in routes per CHALLENGED ACCOUNT.
 *
 * Neither existing tracker works here. `UserThrottlerGuard` reads
 * `req.user.userId`, which does not exist yet — the whole point of these routes
 * is that there is no session. `AuthThrottlerGuard` reads a username or email
 * out of the body, and these bodies carry only a code, so it would fall back to
 * `req.ip` — one shared Next.js proxy IP, i.e. a single budget every admin in
 * the world would share while none of them could be isolated.
 *
 * `req.mfaChallenge` is populated by `MfaChallengeGuard`, which must therefore
 * be listed BEFORE this guard in `@UseGuards`.
 */
@Injectable()
export class MfaChallengeThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const userId = req.mfaChallenge?.userId;
    return userId ? `mfa:${userId}` : req.ip;
  }
}
