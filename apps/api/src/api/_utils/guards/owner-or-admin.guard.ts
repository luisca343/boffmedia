import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';

/**
 * Allows the request when the authenticated user is acting on their own resource
 * (`req.params.id` matches the JWT subject) OR is a BoffMedia admin. Must run
 * after `JwtAuthGuard` so `req.user` is populated.
 */
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Not authenticated');

    const isAdmin = user.roles?.includes(USER_ROLES.BOFF_ADMIN);
    const targetId = String(req.params.id ?? req.params.userId ?? '');
    const isOwner = targetId !== '' && String(user.userId) === targetId;

    if (isAdmin || isOwner) return true;
    throw new ForbiddenException('You can only act on your own account');
  }
}
