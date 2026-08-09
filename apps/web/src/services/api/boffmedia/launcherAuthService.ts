import { apiAuthedAutoGET, apiAuthedAutoPOST } from '@/services/boffAPI';

/** A launcher waiting to be authorized. Shown before the player commits. */
export interface DeviceRequest {
  userCode: string;
  clientLabel: string | null;
  status: 'pending' | 'approved' | 'denied';
  expiresAt: string;
}

/**
 * The website half of the launcher's device-authorization flow. The launcher
 * itself talks to /packs/launcher/auth/device with no session at all — these
 * routes are the part that requires being signed in, which is the whole point:
 * the launcher never handles a password.
 */
export class LauncherAuthService {
  static describe(userCode: string) {
    return apiAuthedAutoGET<DeviceRequest>(
      `/launcher/auth/device?userCode=${encodeURIComponent(userCode)}`,
    );
  }

  static approve(userCode: string) {
    return apiAuthedAutoPOST<{ success: true }>('/launcher/auth/device/approve', {
      userCode,
    });
  }

  static deny(userCode: string) {
    return apiAuthedAutoPOST<{ success: true }>('/launcher/auth/device/deny', {
      userCode,
    });
  }
}
