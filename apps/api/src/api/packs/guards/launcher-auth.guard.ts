import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { extractBearer } from '@api/_utils/auth/server-token';
import { PacksAuthService } from '../packs-auth.service';
import { PacksRepository } from '../packs.repository';
import type { LauncherPrincipal } from '../types/packs.types';

export interface LauncherRequest extends Request {
  launcher?: LauncherPrincipal;
}

/**
 * Authenticates a launcher session.
 *
 * Deliberately self-contained: it extracts and verifies the Bearer itself and
 * populates `req.launcher` rather than reading `req.user`. The launcher routes
 * are `@Public()` so the global JwtAuthGuard lets a launcher token through
 * (it is not a website session), and a guard that depended on that guard having
 * run would silently see nothing — the same shape as the known
 * "@Public() class neuters route guards" trap.
 */
@Injectable()
export class LauncherAuthGuard implements CanActivate {
  constructor(
    private readonly auth: PacksAuthService,
    private readonly repo: PacksRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<LauncherRequest>();
    const token = extractBearer(req);
    if (!token) throw new UnauthorizedException('Falta la sesión del launcher');

    const principal = this.auth.verifySession(token);

    // Coarse revocation: the token embeds the account's launcher_token_version
    // at mint time; a bump (revoke-all) makes every older token stale. A missing
    // account (null) is likewise rejected.
    const current = await this.repo.getLauncherTokenVersion(principal.userId);
    if (current === null || current !== (principal.tokenVersion ?? 0)) {
      throw new UnauthorizedException({
        error: 'needs_newer_launcher',
        message: 'La sesión del launcher ha sido revocada',
      });
    }

    req.launcher = principal;
    return true;
  }
}
