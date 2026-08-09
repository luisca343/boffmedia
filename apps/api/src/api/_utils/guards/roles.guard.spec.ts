import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { FullSessionGuard } from './full-session.guard';
import { USER_ROLES } from '@api/_utils/auth/roles.constants';
import { ROLES_METADATA_KEY } from '@api/_utils/decorators/roles.decorator';
import { Roles } from '@api/_utils/decorators/roles.decorator';

const contextFor = (
  user: unknown,
  handler: () => void,
  cls: new () => unknown,
): ExecutionContext =>
  ({
    getHandler: () => handler,
    getClass: () => cls,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  // The real shape of packs/randomizer/launcher-releases admin controllers:
  // @Roles once on the class, nothing on any method.
  @Roles(USER_ROLES.BOFF_ADMIN)
  class AdminController {
    handler() {}
  }

  class OpenController {
    handler() {}
  }

  it('enforces a class-level @Roles on a method that declares none', () => {
    const proto = AdminController.prototype as { handler: () => void };
    const ctx = contextFor(
      { roles: ['user'] },
      proto.handler,
      AdminController as never,
    );
    expect(guard.canActivate(ctx)).toBe(false);
  });

  it('admits a user holding the class-level role', () => {
    const proto = AdminController.prototype as { handler: () => void };
    const ctx = contextFor(
      { roles: [USER_ROLES.BOFF_ADMIN] },
      proto.handler,
      AdminController as never,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lets routes with no @Roles anywhere through', () => {
    const proto = OpenController.prototype as { handler: () => void };
    const ctx = contextFor(
      { roles: [] },
      proto.handler,
      OpenController as never,
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('lets a method-level @Roles override the class', () => {
    const reflector = new Reflector();
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((key, targets) => {
        expect(key).toBe(ROLES_METADATA_KEY);
        expect(targets).toHaveLength(2);
        return [USER_ROLES.ROTOM_ADMIN] as never;
      });
    const scoped = new RolesGuard(reflector);
    const proto = AdminController.prototype as { handler: () => void };
    const ctx = contextFor(
      { roles: [USER_ROLES.ROTOM_ADMIN] },
      proto.handler,
      AdminController as never,
    );
    expect(scoped.canActivate(ctx)).toBe(true);
  });
});

describe('FullSessionGuard', () => {
  const guard = new FullSessionGuard();
  const ctx = (user: unknown) =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    }) as unknown as ExecutionContext;

  it('admits a website session', () => {
    expect(guard.canActivate(ctx({ tokenType: 'access' }))).toBe(true);
  });

  it('admits a legacy token minted before the typ claim existed', () => {
    expect(guard.canActivate(ctx({ userId: 1 }))).toBe(true);
  });

  it('refuses an in-game session', () => {
    expect(() => guard.canActivate(ctx({ tokenType: 'ingame' }))).toThrow(
      ForbiddenException,
    );
  });
});
