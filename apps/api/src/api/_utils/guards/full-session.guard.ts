import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';

/**
 * Refuses anything that is not a full website session.
 *
 * `/auth/loginmc` mints a session from a Minecraft UUID plus the `MC_WORLD`
 * string, which is documented as non-secret and ships inside the browser
 * bundle — so that session must never be able to change a password, an email,
 * or a linked OAuth provider. Put this on every route where a hijacked in-game
 * session would mean losing the account rather than losing a Rotom-phone page.
 */
@Injectable()
export class FullSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest().user;
    const type = user?.tokenType ?? TOKEN_TYPE.ACCESS;
    if (type !== TOKEN_TYPE.ACCESS) {
      throw new ForbiddenException(
        'Esta acción requiere iniciar sesión en la web',
      );
    }
    return true;
  }
}
