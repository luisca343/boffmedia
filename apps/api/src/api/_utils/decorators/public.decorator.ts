import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route (or a whole controller) as public, exempting it from the global
 * `JwtAuthGuard` registered as an `APP_GUARD`. Secure-by-default: anything NOT
 * marked `@Public()` requires a valid JWT.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
