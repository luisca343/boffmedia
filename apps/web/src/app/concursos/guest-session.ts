export type GuestRoomSession = {
  code: string;
  nickname: string;
  token: string;
};
const STORAGE_KEY = "boffmedia.concursos.guest.v1";

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

export function forgetGuestSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* Storage may be disabled. */
  }
}
