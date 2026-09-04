import type { AuthLoginResponseEntity } from "@boffmedia/shared"
import {
  apiAuthedAutoGET,
  apiAuthedAutoPOST,
  apiAuthedPOST,
} from "@/services/boffAPI"

/**
 * The two-factor endpoints, in the two halves the API separates them into.
 *
 * The `challenge*` calls pass the challenge token EXPLICITLY rather than going
 * through `apiAuthedAuto*`: at that point in the flow there is no session token
 * to pull, and the auto helpers would send an empty Bearer.
 *
 * Response shapes are declared here because `@boffmedia/shared` is regenerated
 * from a running API — see the note in `features/twoFactorSession.ts`.
 */

export interface TwoFactorEnrolment {
  /** Base32 secret, for when the QR cannot be scanned. */
  secret: string
  otpauth_url: string
  /** Inline SVG, so the browser needs no QR library. */
  qr_svg: string
}

export interface TwoFactorStatus {
  required: boolean
  enrolled: boolean
  backup_codes_remaining: number
}

export interface TwoFactorStepUp {
  step_up_token: string
  expires_in: number
}

/** Either half of the factor. The API refuses a request carrying neither. */
export interface TwoFactorInput {
  code?: string
  backupCode?: string
}

export class TwoFactorService {
  // ── mid-sign-in (challenge token) ────────────────────────────────────────

  static startEnrolment(challengeToken: string) {
    return apiAuthedPOST<TwoFactorEnrolment>(
      "/auth/2fa/challenge/enroll/start",
      {},
      challengeToken,
    )
  }

  /** Confirming also SIGNS IN — the same code that proved the secret finishes
   *  the sign-in, so the API returns the session alongside the backup codes. */
  static confirmEnrolment(challengeToken: string, code: string) {
    return apiAuthedPOST<AuthLoginResponseEntity & { backup_codes: string[] }>(
      "/auth/2fa/challenge/enroll/confirm",
      { code },
      challengeToken,
    )
  }

  static verify(challengeToken: string, input: TwoFactorInput) {
    return apiAuthedPOST<AuthLoginResponseEntity>(
      "/auth/2fa/challenge/verify",
      input,
      challengeToken,
    )
  }

  // ── signed in ────────────────────────────────────────────────────────────

  static status() {
    return apiAuthedAutoGET<TwoFactorStatus>("/auth/2fa/status")
  }

  static regenerateBackupCodes(input: TwoFactorInput) {
    return apiAuthedAutoPOST<{ backup_codes: string[] }>(
      "/auth/2fa/backup-codes",
      input,
    )
  }

  /** Exchange a fresh code for the token that sensitive actions demand in the
   *  `X-Step-Up-Token` header. */
  static stepUp(input: TwoFactorInput) {
    return apiAuthedAutoPOST<TwoFactorStepUp>("/auth/2fa/step-up", input)
  }
}
