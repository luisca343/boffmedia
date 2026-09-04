import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { extractBearer } from '@api/_utils/auth/server-token';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';

/** What a challenge-authenticated request carries in place of `req.user`. The
 *  name is different on purpose: nothing downstream should mistake a half-done
 *  sign-in for a session. */
export interface MfaChallengePrincipal {
  userId: number;
  username: string;
}

export type MfaChallengeRequest = Request & {
  mfaChallenge?: MfaChallengePrincipal;
};

/**
 * Authenticates the middle of a sign-in: the password (or the OAuth callback)
 * checked out, the second factor has not been given yet.
 *
 * The credential is the `typ:'mfa'` challenge token minted by `AuthService`. It
 * cannot reach anything else — `WEBSITE_TOKEN_TYPES` does not contain `mfa`, so
 * the normal jwt strategy refuses it — and this guard refuses a STEP-UP token
 * (`su: true`) in turn, so a step-up minted from a live session cannot be
 * replayed as a fresh sign-in for an account that never gave a code.
 */
@Injectable()
export class MfaChallengeGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<MfaChallengeRequest>();
    const bearer = extractBearer(req);
    if (!bearer) throw new UnauthorizedException('Missing challenge token');

    let payload: {
      sub?: number | string;
      username?: string;
      typ?: string;
      su?: boolean;
    };
    try {
      payload = this.jwt.verify(bearer);
    } catch {
      throw new UnauthorizedException('Invalid or expired challenge token');
    }

    if (payload.typ !== TOKEN_TYPE.MFA || payload.su === true) {
      throw new UnauthorizedException('Not a two-factor challenge token');
    }

    const userId = Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new UnauthorizedException('Invalid challenge token');
    }

    req.mfaChallenge = { userId, username: payload.username ?? '' };
    return true;
  }
}
