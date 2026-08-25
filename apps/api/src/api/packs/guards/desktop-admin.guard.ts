import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { PacksRepository } from '../packs.repository';
import { DesktopAuthGuard, type DesktopRequest } from './desktop-auth.guard';

/**
 * A desktop-app session that ALSO belongs to a Boffmedia admin.
 *
 * Publishing a pack from the launcher reverses a decision the dashboard
 * controller states outright — "pack authoring lives in the web app, not the
 * launcher" — so it is reversed as narrowly as it can be: one extra guard, no
 * new service logic, and the same BOFF_ADMIN role the web routes require.
 * Everything behind it delegates to the exact methods `packs/admin` calls.
 *
 * Why a second guard rather than `@Roles(BOFF_ADMIN)` + RolesGuard: RolesGuard
 * reads `req.user.roles`, which is populated by the WEBSITE session guard. A
 * desktop token is not a website session — it lands in `req.desktopClient` and
 * carries no roles at all — so RolesGuard would read `undefined` and refuse
 * every request. Composing on DesktopAuthGuard rather than duplicating it keeps
 * the token-version revocation check in exactly one place.
 */
@Injectable()
export class DesktopAdminGuard implements CanActivate {
  constructor(
    private readonly desktop: DesktopAuthGuard,
    private readonly repo: PacksRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Throws on a missing, invalid or revoked session, and populates
    // `req.desktopClient` — which is what the role lookup below reads.
    await this.desktop.canActivate(context);

    const req = context.switchToHttp().getRequest<DesktopRequest>();
    const userId = req.desktopClient?.userId;
    if (userId === undefined) throw new ForbiddenException('Sesión no válida');

    const roles = await this.repo.rolesOf(userId);
    if (!roles.includes(USER_ROLES.BOFF_ADMIN)) {
      throw new ForbiddenException(
        'Publicar packs desde la app requiere ser administrador',
      );
    }
    return true;
  }
}
