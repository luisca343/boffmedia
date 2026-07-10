import { SetMetadata } from '@nestjs/common';

export const IS_OPTIONAL_AUTH_KEY = 'isOptionalAuth';

/**
 * Marks a route as optionally authenticated. The global `JwtAuthGuard` still
 * runs passport, but a missing/invalid token does NOT reject the request: the
 * route stays reachable anonymously (`req.user` is `undefined`) and is populated
 * (`req.user` set) when a valid token is present. Use for otherwise-public
 * endpoints whose response should vary by the caller's role — e.g. a public list
 * that also exposes private rows to admins.
 */
export const OptionalAuth = () => SetMetadata(IS_OPTIONAL_AUTH_KEY, true);
