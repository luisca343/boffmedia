import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@api/_utils/decorators/public.decorator';

/**
 * JWT auth guard. Registered as the global `APP_GUARD` (secure-by-default), so
 * it also honours the `@Public()` decorator: a route/controller marked public
 * skips authentication. Still usable per-route via `@UseGuards(JwtAuthGuard)` —
 * an explicitly-guarded route is never public.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
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
}
