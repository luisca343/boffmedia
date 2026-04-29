import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { UserRole } from '@boffmedia/shared';
import { ROLES_METADATA_KEY } from '@api/_utils/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<UserRole[]>(ROLES_METADATA_KEY, context.getHandler());
    if (!required) return true;
    const user = context.switchToHttp().getRequest().user;
    return required.some((r) => user?.roles?.includes(r));
  }
}
