import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClientsGuard } from './clients.guard';
import { CLIENT, Clients } from '@api/_utils/decorators/clients.decorator';
import { fakeExecutionContext } from '@/_testing/nest-context';

/** A token shaped like a JWT with the given claims. The guard classifies by
 *  DECODING, never by verifying, so the signature is deliberately garbage —
 *  that is the whole reason it is safe to run before any auth guard. */
const tokenWith = (claims: Record<string, unknown>): string =>
  [
    Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString(
      'base64url',
    ),
    Buffer.from(JSON.stringify({ sub: 1, ...claims })).toString('base64url'),
    'not-a-real-signature',
  ].join('.');

const WEB_TOKEN = tokenWith({}); // an access token carries NO `typ` claim
const DESKTOP_TOKEN = tokenWith({ typ: 'launcher' }); // the wire value, not 'desktop'
const INGAME_TOKEN = tokenWith({ typ: 'ingame' });

const contextFor = (
  bearer: string | null,
  handler: () => void,
  cls: new () => unknown,
): ExecutionContext =>
  fakeExecutionContext({
    request: {
      headers: bearer ? { authorization: `Bearer ${bearer}` } : {},
    },
    // The real handler/class: Reflector keys @Clients on that exact pair.
    handler,
    cls,
  });

describe('ClientsGuard', () => {
  const guard = new ClientsGuard(new Reflector());

  @Clients(CLIENT.WEB)
  class WebOnlyController {
    handler() {}
  }

  @Clients(CLIENT.DESKTOP)
  class DesktopOnlyController {
    handler() {}
  }

  class UndecoratedController {
    handler() {}
  }

  const run = (
    bearer: string | null,
    cls: new () => { handler: () => void },
  ) => {
    const proto = cls.prototype as { handler: () => void };
    return guard.canActivate(contextFor(bearer, proto.handler, cls as never));
  };

  it('refuses a desktop session on a web-only route', () => {
    expect(() => run(DESKTOP_TOKEN, WebOnlyController)).toThrow(
      ForbiddenException,
    );
  });

  it('refuses a website session on a desktop-only route', () => {
    expect(() => run(WEB_TOKEN, DesktopOnlyController)).toThrow(
      ForbiddenException,
    );
  });

  it('admits each client on the route that declares it', () => {
    expect(run(WEB_TOKEN, WebOnlyController)).toBe(true);
    expect(run(DESKTOP_TOKEN, DesktopOnlyController)).toBe(true);
  });

  describe('the ingame surface', () => {
    it('reaches an undecorated route — the default is web + ingame', () => {
      expect(run(INGAME_TOKEN, UndecoratedController)).toBe(true);
    });

    it('is refused where the route declares web only', () => {
      // The same narrowing FullSessionGuard performs, stated declaratively:
      // a Mojang-proven identity is not a website sign-in.
      expect(() => run(INGAME_TOKEN, WebOnlyController)).toThrow(
        ForbiddenException,
      );
    });
  });

  it('refuses a desktop session on an UNDECORATED route', () => {
    // The default is not "any client": desktop must opt in per route, which is
    // exactly what JwtStrategy already enforces through WEBSITE_TOKEN_TYPES.
    expect(() => run(DESKTOP_TOKEN, UndecoratedController)).toThrow(
      ForbiddenException,
    );
  });

  describe('credentials that name no client', () => {
    it('lets an anonymous request through — public routes stay public', () => {
      expect(run(null, DesktopOnlyController)).toBe(true);
      expect(run(null, UndecoratedController)).toBe(true);
    });

    it("lets the Minecraft mod's opaque server token through", () => {
      // Not a JWT at all: GameServerAuthGuard is what judges it.
      expect(run('teras-opaque-api-token', UndecoratedController)).toBe(true);
    });

    it('lets refresh and mfa tokens reach their own endpoints', () => {
      // Neither is a client surface; /auth/refresh and /auth/2fa/* reject them
      // on their own terms, and a 403 here would mask that.
      expect(run(tokenWith({ typ: 'refresh' }), UndecoratedController)).toBe(
        true,
      );
      expect(run(tokenWith({ typ: 'mfa' }), UndecoratedController)).toBe(true);
    });

    it('ignores a malformed token rather than masking the 401', () => {
      expect(run('a.b.c', UndecoratedController)).toBe(true);
    });
  });

  it('does not run outside HTTP (Necord routes Discord events here too)', () => {
    const proto = DesktopOnlyController.prototype as { handler: () => void };
    const ctx = fakeExecutionContext({
      type: 'discord',
      handler: proto.handler,
      cls: DesktopOnlyController as never,
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
