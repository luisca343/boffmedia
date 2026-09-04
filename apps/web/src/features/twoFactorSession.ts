import type { AuthLoginResponseEntity } from "@boffmedia/shared"

/**
 * The shapes the two-factor sign-in hand-off travels in.
 *
 * They are declared here rather than imported from `@boffmedia/shared` because
 * that package is generated from the running API's OpenAPI document — it cannot
 * describe an endpoint until someone regenerates it against a live server. These
 * mirror `AuthTwoFactorChallengeEntity` in
 * `apps/api/src/api/auth/entities/auth-response.entity.ts`; keep them in step.
 */

/** What `/auth/login` and the OAuth callbacks answer with for an ADMIN account:
 *  the password (or OAuth identity) checked out, the second factor has not. */
export interface TwoFactorChallenge {
  required: true
  /** false = no factor enrolled yet, so the client must walk the user through
   *  enrolment. Admin 2FA is mandatory, so this is a step, not an offer. */
  enrolled: boolean
  /** Short-lived `typ:'mfa'` token. Authenticates `/auth/2fa/challenge/*` and
   *  nothing else — it is not a session and grants no account powers. */
  challenge_token: string
}

/** `/auth/login` answers with one or the other, never both. */
export type LoginOrChallenge =
  | AuthLoginResponseEntity
  | { two_factor: TwoFactorChallenge }

/**
 * The argument `/entrar/2fa` passes to NextAuth's `update()` once the API has
 * minted a real session. The `jwt` callback is the only place that reads it, and
 * it copies the values straight through — the page can never forge a token, it
 * only relays what `/auth/2fa/challenge/*` returned.
 */
export interface TwoFactorSessionUpdate {
  twoFactor?: AuthLoginResponseEntity
}

/**
 * The `id` a half-finished admin sign-in carries. NextAuth requires `user.id` to
 * be set, and the challenge response deliberately identifies nobody — a sentinel
 * is honest about that, where reusing the OAuth provider's subject would put a
 * foreign id where the rest of the app expects a Boffmedia one.
 */
export const PENDING_TWO_FACTOR_USER_ID = "pending-2fa"
