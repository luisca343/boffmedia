import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@api/_utils/auth/roles.constants';
import { ROLES_METADATA_KEY } from '@api/_utils/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Both levels, handler first: controllers such as `packs/admin`,
    // `randomizer/admin` and `desktop/admin/releases` declare @Roles once on
    // the class and never per method. Reading only the handler made every one
    // of those routes reachable by any logged-in user.
    const required = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;
    const user = context.switchToHttp().getRequest().user;
    return required.some((r) => user?.roles?.includes(r));
  }
}
