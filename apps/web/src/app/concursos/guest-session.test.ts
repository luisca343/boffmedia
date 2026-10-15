import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  forgetGuestSession,
  restoreRecoveryAttempt,
  saveRecoveryAttempt,
  forgetRecoveryAttempt,
  guestCapability,
  restoreGuestSession,
  saveGuestSession,
} from "./guest-session";

describe("anonymous room reconnect storage", () => {
  let values: Map<string, string>;
  beforeEach(() => {
    values = new Map();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    });
  });
  it("keeps a pending applicant separate from an authorized guest on refresh", () => {
    const guest = { code: "ABCDEF", nickname: "Ana", token: guestCapability() };
    const applicant = { ...guest, token: guestCapability() };
    saveGuestSession(guest);
    saveRecoveryAttempt(applicant);
    expect(restoreGuestSession()).toEqual(guest);
    expect(restoreRecoveryAttempt()).toEqual(applicant);
    forgetRecoveryAttempt(applicant);
    expect(restoreRecoveryAttempt()).toBeNull();
    expect(restoreGuestSession()).toEqual(guest);
  });
  it("does not let a revoked older tab erase a newer authorized session or request", () => {
    const old = { code: "ABCDEF", nickname: "Ana", token: guestCapability() };
    const current = { ...old, token: guestCapability() };
    saveGuestSession(current);
    saveRecoveryAttempt(current);
    forgetGuestSession(old);
    forgetRecoveryAttempt(old);
    expect(restoreGuestSession()).toEqual(current);
    expect(restoreRecoveryAttempt()).toEqual(current);
    forgetGuestSession(current);
    expect(restoreGuestSession()).toBeNull();
  });
  it("rejects malformed pending credentials and tolerates disabled storage", () => {
    values.set(
      "boffmedia.concursos.recovery.v1",
      JSON.stringify({ code: "ABCDEF", nickname: "Ana", token: "short" }),
    );
    expect(restoreRecoveryAttempt()).toBeNull();
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw Error("disabled");
      },
      setItem: () => {
        throw Error("disabled");
      },
      removeItem: () => {
        throw Error("disabled");
      },
    });
    expect(restoreRecoveryAttempt()).toBeNull();
    expect(() =>
      saveRecoveryAttempt({
        code: "ABCDEF",
        nickname: "Ana",
        token: guestCapability(),
      }),
    ).not.toThrow();
    expect(() => forgetRecoveryAttempt()).not.toThrow();
  });
  it("uses a fresh opaque capability without an account", () => {
    expect(guestCapability()).toMatch(/^[a-f0-9]{48}$/);
    expect(guestCapability()).not.toBe(guestCapability());
  });
  it("recovers exactly one player identity on refresh and forgets on explicit leave", () => {
    const session = {
      code: "ABCDEF",
      nickname: "Lucía",
      token: guestCapability(),
    };
    saveGuestSession(session);
    expect(restoreGuestSession()).toEqual(session);
    forgetGuestSession();
    expect(restoreGuestSession()).toBeNull();
  });
  it.each([
    "{broken",
    JSON.stringify({ code: "ABC", nickname: "Ana", token: "short" }),
    JSON.stringify({ code: "ABCDEF", nickname: " ", token: "a".repeat(48) }),
  ])("rejects malformed stored identity", (value) => {
    values.set("boffmedia.concursos.guest.v1", value);
    expect(restoreGuestSession()).toBeNull();
  });
  it("keeps the live tab usable when browser storage is disabled", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("disabled");
      },
      setItem: () => {
        throw new Error("disabled");
      },
      removeItem: () => {
        throw new Error("disabled");
      },
    });
    expect(restoreGuestSession()).toBeNull();
    expect(() =>
      saveGuestSession({
        code: "ABCDEF",
        nickname: "Ana",
        token: guestCapability(),
      }),
    ).not.toThrow();
    expect(() => forgetGuestSession()).not.toThrow();
  });
});
