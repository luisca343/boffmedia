import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { extractBearer } from '@api/_utils/auth/server-token';
import type { AuthPrincipal } from '@api/_utils/decorators/current-user.decorator';
import { PacksAuthService } from '@api/packs/packs-auth.service';
import { PacksRepository } from '@api/packs/packs.repository';
import type { DesktopPrincipal } from '@api/packs/types/packs.types';

type ChangelogRequest = Request & { user?: AuthPrincipal };

/**
 * Public changelog GETs may enrich their response with a website or launcher
 * identity, but must remain readable anonymously. The launcher credential is
 * verified explicitly because the global website JwtAuthGuard intentionally
 * does not accept `typ: launcher`.
 */
@Injectable()
export class OptionalChangelogAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly desktopAuth: PacksAuthService,
    private readonly packsRepo: PacksRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ChangelogRequest>();
    const token = extractBearer(req);
    if (!token) return true;

    if (isLauncherToken(token)) {
      try {
        await this.authenticateDesktop(req, token);
      } catch {
        // A stale optional credential must not turn a public page into a 401.
        delete req.user;
      }
      return true;
    }

    try {
      return (await super.canActivate(context)) as boolean;
    } catch {
      // Same anonymous fallback for an expired website token.
      delete req.user;
      return true;
    }
  }

  handleRequest<TUser = AuthPrincipal>(
    _err: unknown,
    user: TUser,
  ): TUser | undefined {
    return user ?? undefined;
  }

  protected async authenticateDesktop(
    req: ChangelogRequest,
    token: string,
  ): Promise<void> {
    const principal = this.desktopAuth.verifySession(token);
    await assertCurrentDesktopSession(this.packsRepo, principal);
    req.user = toAuthPrincipal(
      principal,
      await this.packsRepo.rolesOf(principal.userId),
    );
  }
}

/**
 * Required variant used by `POST /changelogs/seen`. It is still placed on a
 * `@Public()` route so the global website guard does not reject a launcher JWT
 * before this composite guard gets a chance to handle it.
 */
@Injectable()
export class ChangelogAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly desktopAuth: PacksAuthService,
    private readonly packsRepo: PacksRepository,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ChangelogRequest>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException('Authentication required');

    if (isLauncherToken(token)) {
      const principal = this.desktopAuth.verifySession(token);
      await assertCurrentDesktopSession(this.packsRepo, principal);
      req.user = toAuthPrincipal(
        principal,
        await this.packsRepo.rolesOf(principal.userId),
      );
      return true;
    }

    return (await super.canActivate(context)) as boolean;
  }
}

function isLauncherToken(token: string): boolean {
  const segments = token.split('.');
  if (segments.length !== 3) return false;
  try {
    const payload = JSON.parse(
      Buffer.from(segments[1], 'base64url').toString('utf8'),
    ) as { typ?: string };
    return payload.typ === 'launcher';
  } catch {
    return false;
  }
}

async function assertCurrentDesktopSession(
  repo: PacksRepository,
  principal: DesktopPrincipal,
): Promise<void> {
  const current = await repo.getDesktopTokenVersion(principal.userId);
  if (current === null || current !== (principal.tokenVersion ?? 0)) {
    throw new UnauthorizedException({
      error: 'needs_newer_desktop',
      message: 'La sesión de la app ha sido revocada',
    });
  }
}

function toAuthPrincipal(
  principal: DesktopPrincipal,
  roles: string[],
): AuthPrincipal {
  return {
    userId: principal.userId,
    username: principal.username,
    roles,
    tokenType: 'launcher',
    ...(principal.mcUuid ? { mcUuid: principal.mcUuid } : {}),
  };
}
