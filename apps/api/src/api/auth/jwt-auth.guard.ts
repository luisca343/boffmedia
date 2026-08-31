import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@api/_utils/decorators/public.decorator';
import { IS_OPTIONAL_AUTH_KEY } from '@api/_utils/decorators/optional-auth.decorator';

/**
 * JWT auth guard. Registered as the global `APP_GUARD` (secure-by-default), so
 * it also honours the `@Public()` decorator: a route/controller marked public
 * skips authentication. Also usable per-route via `@UseGuards(JwtAuthGuard)`, but
 * `@Public()` still wins — including a CLASS-level one, which silently turns a
 * route-level `@UseGuards(JwtAuthGuard)` into a no-op. Mark the public GETs
 * individually instead of the controller (see the gobierno controllers).
 *
 * `@OptionalAuth()` routes run passport but never reject: a valid token
 * populates `req.user`, a missing/invalid one leaves it `undefined`.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // APP_GUARDs also run on non-HTTP external contexts, and Necord routes
    // every Discord event/command through one. There `switchToHttp()` returns
    // the event args, so passport-jwt read `request.headers.authorization` off
    // an array and threw. There is no HTTP request to authenticate here —
    // Discord's own permissions are the boundary. (GlobalThrottlerGuard already
    // bails the same way; this guard was the one that did not.)
    if (context.getType<string>() !== 'http') return true;

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Infra routes served by library controllers we can't decorate with
    // @Public() (Prometheus /metrics). Swagger (/api-json) and static /public
    // are served outside the Nest router, so they already bypass this guard.
    const req = context.switchToHttp().getRequest();
    if (typeof req?.url === 'string' && req.url.split('?')[0] === '/metrics') {
      return true;
    }

    return super.canActivate(context);
  }

  /**
   * For `@OptionalAuth()` routes, don't throw on a missing/invalid token —
   * return the resolved user or `undefined` so the request proceeds anonymously.
   */
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_OPTIONAL_AUTH_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isOptional) {
      return (user ?? undefined) as TUser;
    }
    return super.handleRequest(err, user, info, context, status);
  }
}
