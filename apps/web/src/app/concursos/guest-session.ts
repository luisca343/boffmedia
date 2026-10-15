export type GuestRoomSession = {
  code: string;
  nickname: string;
  token: string;
};
const STORAGE_KEY = "boffmedia.concursos.guest.v1";
const RECOVERY_STORAGE_KEY = "boffmedia.concursos.recovery.v1";

export function guestCapability(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function restoreGuestSession(): GuestRoomSession | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const session = value as Partial<GuestRoomSession>;
    if (
      typeof session.code !== "string" ||
      !/^[A-Z]{6}$/.test(session.code) ||
      typeof session.nickname !== "string" ||
      !session.nickname.trim() ||
      session.nickname.length > 24 ||
      typeof session.token !== "string" ||
      !/^[a-f0-9]{48}$/.test(session.token)
    )
      return null;
    return session as GuestRoomSession;
  } catch {
    return null;
  }
}

export function saveGuestSession(session: GuestRoomSession): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* The live tab still works when storage is unavailable. */
  }
}

export function forgetGuestSession(expected?: GuestRoomSession): void {
  try {
    if (expected && restoreGuestSession()?.token !== expected.token) return;
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}

export function restoreRecoveryAttempt(): GuestRoomSession | null {
  try {
    const session: Partial<GuestRoomSession> | null = JSON.parse(
      localStorage.getItem(RECOVERY_STORAGE_KEY) ?? "null",
    );
    if (
      !session ||
      typeof session.code !== "string" ||
      !/^[A-Z]{6}$/.test(session.code) ||
      typeof session.nickname !== "string" ||
      !session.nickname.trim() ||
      session.nickname.length > 24 ||
      typeof session.token !== "string" ||
      !/^[a-f0-9]{48}$/.test(session.token)
    )
      return null;
    return session as GuestRoomSession;
  } catch {
    return null;
  }
}
export function saveRecoveryAttempt(session: GuestRoomSession): void {
  try {
    localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* Live request still works without storage. */
  }
}
export function forgetRecoveryAttempt(expected?: GuestRoomSession): void {
  try {
    if (!expected || restoreRecoveryAttempt()?.token === expected.token)
      localStorage.removeItem(RECOVERY_STORAGE_KEY);
  } catch {
    /* Storage can be disabled. */
  }
}
