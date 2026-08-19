import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * What `JwtStrategy.validate()` puts on the request. `mcUuid` is the Minecraft
 * account uuid — the key every SmartRotom row is owned by — and is absent for a
 * Boffmedia account that has never linked one.
 */
export interface AuthPrincipal {
  userId: number;
  username?: string;
  email?: string;
  roles?: string[];
  tokenType?: string;
  mcUuid?: string;
}

/**
 * The authenticated principal, straight off the token.
 *
 * Use this instead of taking an owner id from `@Param('uuid')` or a DTO field.
 * Routes used to read the owner out of the request — `GET folders/:uuid`,
 * `POST folders { uuid }` — which let any caller name whose data to touch, so
 * authenticating the route alone would not have fixed anything.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
    return ctx.switchToHttp().getRequest().user as AuthPrincipal;
  },
);

/**
 * The caller's Minecraft uuid, or 403 when the account has no linked identity.
 * Every SmartRotom row is owned by this value, so a route that touches one
 * cannot proceed without it.
 */
export const CurrentMcUuid = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const user = ctx.switchToHttp().getRequest().user as
      | AuthPrincipal
      | undefined;
    if (!user?.mcUuid) {
      throw new ForbiddenException(
        'Esta cuenta no tiene una identidad de Minecraft vinculada',
      );
    }
    return user.mcUuid;
  },
);

/**
 * The caller's Minecraft uuid when there is one, `undefined` otherwise. For
 * `@OptionalAuth()` routes whose response widens for a signed-in owner — a
 * public note stays readable anonymously, a private one does not.
 */
export const CurrentMcUuidOptional = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const user = ctx.switchToHttp().getRequest().user as
      | AuthPrincipal
      | undefined;
    return user?.mcUuid;
  },
);
