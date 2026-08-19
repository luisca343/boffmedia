import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from './public.decorator';

/**
 * The inverse of `@Public()`, for one route inside a controller that is public
 * as a whole.
 *
 * `JwtAuthGuard` resolves the public flag with `getAllAndOverride([handler,
 * class])`, which returns the HANDLER's value whenever it is defined — so
 * setting it to `false` here beats a class-level `@Public()`. That is the only
 * way to require a session on a single route of a public controller:
 * `@UseGuards(JwtAuthGuard)` does NOT work, because the class-level `@Public()`
 * short-circuits the guard before it ever authenticates (see the note in
 * `jwt-auth.guard.ts`).
 *
 * Used where reads are genuinely public but writes are not — Rooker's timeline
 * is readable by anyone, while posting, following or deleting a trino is not.
 */
export const RequireSession = () => SetMetadata(IS_PUBLIC_KEY, false);
