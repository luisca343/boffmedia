import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ApiErrorCode, userError } from '@/common/errors/user-error';
import { extractBearer } from '@api/_utils/auth/secret-compare';
import { tokenTypeOf } from '@api/_utils/auth/token-types';
import {
  CLIENTS_KEY,
  DEFAULT_CLIENTS,
  clientOfTokenType,
  type Client,
} from '@api/_utils/decorators/clients.decorator';

/**
 * Enforces the per-route client model declared with `@Clients()`.
 *
 * Registered as an `APP_GUARD` *after* `JwtAuthGuard` so an invalid or expired
 * token still answers 401 from the usual place; this guard only ever turns an
 * otherwise-valid credential away for being the WRONG KIND of client, which is
 * a 403.
 *
 * It reads the `typ` claim off the Bearer itself rather than off `req.user`,
 * and that is not laziness: global guards run BEFORE controller and route
 * guards, so at this point `req.user` (jwt strategy) and `req.desktopClient`
 * (`DesktopAuthGuard`) are both still empty, and on a `@Public()` desktop route
 * they would stay empty until long after this guard has answered. Decoding
 * without verifying is safe here because this guard only REFUSES: a forged or
 * tampered token is still rejected moments later by the guard that actually
 * verifies the signature, and `typ` cannot be edited without breaking it.
 *
 * Composes with, and replaces nothing:
 *  - `JwtAuthGuard` / `DesktopAuthGuard` — *is this credential valid?*
 *  - `RolesGuard` — *what may this human do?*
 *  - `FullSessionGuard` — *is this a real website sign-in?* (the `ingame` half
 *    of what this guard expresses, kept because it is already on ~11 files)
 *  - `StepUpGuard` — *did they prove the second factor just now?*
 */
@Injectable()
export class ClientsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Necord routes every Discord event through the APP_GUARD chain, where
    // `switchToHttp()` returns the event args and there is no request to read.
    // Same bail-out as JwtAuthGuard and GlobalThrottlerGuard.
    if (context.getType<string>() !== 'http') return true;

    const req = context.switchToHttp().getRequest<Request>();
    const bearer = extractBearer(req);
    // Anonymous. Public routes stay public; anything else is rejected by the
    // auth guard, not here.
    if (!bearer) return true;

    const client = clientOfBearer(bearer);
    // Not a Boffmedia JWT (the Minecraft mod's opaque `apiToken` lands here) or
    // a token type that is not a client surface at all (`refresh`, `mfa`).
    // Their own endpoints know what to do with them.
    if (!client) return true;

    const allowed =
      this.reflector.getAllAndOverride<Client[]>(CLIENTS_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_CLIENTS;

    if (!allowed.includes(client)) {
      throw new ForbiddenException(
        userError(
          ApiErrorCode.AUTH_CLIENT_NOT_ALLOWED,
          `client '${client}' may not call this route (allowed: ${allowed.join(', ')})`,
        ),
      );
    }

    return true;
  }
}

/** The client holding this Bearer, or `undefined` when it names none. */
function clientOfBearer(bearer: string): Client | undefined {
  const segments = bearer.split('.');
  if (segments.length !== 3) return undefined;
  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    ) as { typ?: string };
    return clientOfTokenType(tokenTypeOf(payload));
  } catch {
    return undefined;
  }
}
