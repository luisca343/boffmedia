import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiErrorCode } from '@/common/errors/user-error';
import { TOKEN_TYPE } from '@api/_utils/auth/token-types';
import { STEP_UP_HEADER, StepUpGuard } from './step-up.guard';
import { fakeExecutionContext } from '@/_testing/nest-context';

const SECRET = 'test-secret-that-is-long-enough-32chars';

const contextFor = (
  headers: Record<string, string>,
  user?: { userId: number },
): ExecutionContext => fakeExecutionContext({ request: { headers, user } });

describe('StepUpGuard', () => {
  const jwt = new JwtService({ secret: SECRET });
  const guard = new StepUpGuard(jwt);

  const stepUpToken = (sub: number) =>
    jwt.sign({ sub, typ: TOKEN_TYPE.MFA, su: true }, { expiresIn: '5m' });

  it('lets a matching step-up token through', () => {
    const ctx = contextFor({ [STEP_UP_HEADER]: stepUpToken(1) }, { userId: 1 });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('refuses when the header is absent, with the code the client prompts on', () => {
    const ctx = contextFor({}, { userId: 1 });

    try {
      guard.canActivate(ctx);
      throw new Error('should have thrown');
    } catch (error: any) {
      expect(error).toBeInstanceOf(ForbiddenException);
      expect(error.response.code).toBe(ApiErrorCode.AUTH_STEP_UP_REQUIRED);
    }
  });

  it('refuses ANOTHER admin step-up token', () => {
    // Without the sub binding, one admin's confirmation would authorise every
    // other admin's publish for its whole lifetime.
    const ctx = contextFor({ [STEP_UP_HEADER]: stepUpToken(2) }, { userId: 1 });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuses a plain session token', () => {
    const ctx = contextFor(
      { [STEP_UP_HEADER]: jwt.sign({ sub: 1 }) },
      { userId: 1 },
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuses a two-factor CHALLENGE token', () => {
    // A challenge is minted before any code is given; only `su: true` means a
    // code was just checked.
    const ctx = contextFor(
      { [STEP_UP_HEADER]: jwt.sign({ sub: 1, typ: TOKEN_TYPE.MFA }) },
      { userId: 1 },
    );

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuses an expired step-up token', () => {
    const expired = jwt.sign(
      { sub: 1, typ: TOKEN_TYPE.MFA, su: true },
      { expiresIn: '-1s' },
    );
    const ctx = contextFor({ [STEP_UP_HEADER]: expired }, { userId: 1 });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('refuses a token signed with a different secret', () => {
    const forged = new JwtService({ secret: 'another-secret-of-at-least-32-chars!!' }).sign(
      { sub: 1, typ: TOKEN_TYPE.MFA, su: true },
    );
    const ctx = contextFor({ [STEP_UP_HEADER]: forged }, { userId: 1 });

    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
