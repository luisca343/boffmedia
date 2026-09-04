import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';

/** The header a step-up token travels in.
 *
 *  A header rather than a body field on purpose: the release upload is a raw
 *  `application/octet-stream` body that goes straight to disk, so it has no
 *  JSON to put a field in — and gating "publish" but not "upload the artifact"
 *  would gate the wrong half. */
export const STEP_UP_HEADER = 'x-step-up-token';

/**
 * Demands a FRESH second factor for one action, on top of an already valid
 * admin session.
 *
 * The session-level 2FA check happens once, at sign-in, and the session then
 * lives for hours. That is the right trade for reading an admin page and the
 * wrong one for publishing: a borrowed laptop, a stolen access token or an
 * XSS-driven request all inherit a session that was legitimately created. A
 * step-up asks the person to prove, in the last few minutes, that they still
 * hold the authenticator.
 *
 * Put it on the actions the audit named — desktop release publishing and pack
 * publishing — i.e. every action that changes what runs on someone else's
 * machine.
 *
 * The token is minted by `POST /auth/2fa/step-up` from a real TOTP code and is
 * bound to the account (`sub`), so it cannot be lifted from one admin's request
 * and replayed on another's. It is deliberately NOT single-use: publishing a
 * release is an upload followed by a publish, and asking for two codes in a row
 * trains people to keep the authenticator open, which is worse.
 */
@Injectable()
export class StepUpGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<
      Request & { user?: { userId?: number } }
    >();
    const raw = req.headers[STEP_UP_HEADER];
    const token = Array.isArray(raw) ? raw[0] : raw;

    if (!token) throw stepUpRequired();

    let payload: { sub?: number | string; typ?: string; su?: boolean };
    try {
      payload = this.jwt.verify(token);
    } catch {
      // Expired is the common case and reads identically to absent from the
      // client's side: prompt again.
      throw stepUpRequired();
    }

    if (payload.typ !== TOKEN_TYPE.MFA || payload.su !== true) {
      throw stepUpRequired();
    }
    // Bound to the signed-in account. Without this, any admin's step-up token
    // would authorise any other admin's publish for its whole lifetime.
    if (Number(payload.sub) !== Number(req.user?.userId)) {
      throw stepUpRequired();
    }

    return true;
  }
}

function stepUpRequired(): ForbiddenException {
  return new ForbiddenException(
    userError(
      ApiErrorCode.AUTH_STEP_UP_REQUIRED,
      'this action requires a fresh two-factor confirmation',
    ),
  );
}
