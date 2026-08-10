import { apiAuthedAutoPOST, apiPOST } from '@/services/boffAPI';

interface SuccessResult {
  success: boolean;
}

export interface McDeviceCode {
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  intervalSeconds: number;
}

export interface McLinkPoll {
  status: 'pending' | 'linked' | 'declined' | 'expired';
  uuid?: string;
  username?: string;
}

export interface McJoinChallenge {
  serverId: string;
  expiresInSeconds: number;
}

interface ResetResult {
  success: boolean;
  /** Account username, returned so the web can auto-sign-in after reset. */
  username: string;
}

/**
 * Password-reset + email-verification flows. All four endpoints are public and
 * throttled server-side; forgot/resend always resolve generically (they never
 * reveal whether an address is registered).
 */
export class AuthService {
  /** Request a password-reset email. Always resolves (no account enumeration). */
  static forgotPassword(email: string) {
    return apiPOST<SuccessResult>('/auth/forgot', { email });
  }

  /** Consume a reset token and set a new password. Returns the username. */
  static resetPassword(token: string, newPassword: string) {
    return apiPOST<ResetResult>('/auth/reset', { token, newPassword });
  }

  /** Consume a verification token and mark the email verified. */
  static verifyEmail(token: string) {
    return apiPOST<SuccessResult>('/auth/verify-email', { token });
  }

  /** Send (or resend) a verification email. Always resolves generically. */
  static resendVerification(email: string) {
    return apiPOST<SuccessResult>('/auth/resend-verification', { email });
  }

  // ── Minecraft linking (Microsoft device code) ────────────────────────────
  //
  // Replaces the old link paths, which authenticated on the MC_WORLD string —
  // documented as non-secret and shipped in this very bundle, so knowing a
  // player's UUID was enough to attach it to your own account.

  static startMinecraftLink() {
    return apiAuthedAutoPOST<McDeviceCode>('/auth/minecraft/link/start', {});
  }

  /** One Microsoft poll per call; the browser sets the cadence. */
  static pollMinecraftLink() {
    return apiAuthedAutoPOST<McLinkPoll>('/auth/minecraft/link/poll', {});
  }

  /**
   * Step 1 of the in-game Mojang handshake: a serverId for the mod to join
   * against. Public and short-lived (60s), and consumed by the first
   * `/auth/minecraft/session` call whatever its outcome — a retry needs a fresh
   * one.
   */
  static minecraftChallenge() {
    return apiPOST<McJoinChallenge>('/auth/minecraft/challenge', {});
  }
}
