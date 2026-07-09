import { apiPOST } from '@/services/boffAPI';

interface SuccessResult {
  success: boolean;
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
}
