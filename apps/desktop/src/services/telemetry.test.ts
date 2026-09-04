import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  crashKindToTelemetryCode,
  emitGameCrash,
  emitInstallComplete,
  emitGameLaunch,
} from "./telemetry-integration"
import type { Settings } from "./types"

/**
 * The opt-in is the whole reason this feature is allowed to exist, so it is
 * tested at the EMIT sites the app actually calls — not on the sender in
 * isolation. A test that calls sendTelemetryEvent directly proves nothing about
 * whether install/launch/crash remember to check the toggle.
 */

const settings = (telemetry: boolean) => ({ telemetry }) as unknown as Settings

describe("telemetry opt-in", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal("fetch", fetchMock)
  })

  it("sends nothing at all while the toggle is off", async () => {
    const off = settings(false)

    await emitInstallComplete(off, "install-1", true)
    await emitInstallComplete(off, "install-1", false)
    await emitGameLaunch(off, "install-1")
    await emitGameCrash(off, "install-1", "out-of-memory")

    // Not "fewer requests" — zero bytes leave the machine.
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("sends once the user has opted in", async () => {
    await emitGameLaunch(settings(true), "install-1")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("records failed installs too, so a success rate is not 100% by construction", async () => {
    await emitInstallComplete(settings(true), "install-1", false)

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body.eventName).toBe("install-done")
    expect(body.code).toBe("failed")
  })

  it("carries only the four declared fields, and no PII", async () => {
    await emitGameCrash(settings(true), "install-abc", "wrong-java")

    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(Object.keys(body).sort()).toEqual(["code", "eventName", "installId"])
    expect(body.installId).toBe("install-abc")
    // No path, username, account id or free text can ride along.
    expect(JSON.stringify(body)).not.toMatch(/[\/]|@/)
  })
})

describe("crash codes track crash.rs", () => {
  // CrashKind in apps/desktop/src-tauri/src/install/crash.rs is
  // #[serde(rename_all = "kebab-case")], so these are the strings that actually
  // arrive on GameState.diagnosis.kind.
  const CRASH_KINDS = [
    "missing-dependency",
    "loader-mismatch",
    "mixin-failure",
    "out-of-memory",
    "wrong-java",
    "corrupt-mod-jar",
    "duplicate-mod",
  ]

  it("maps every CrashKind variant to its own code", () => {
    const codes = CRASH_KINDS.map(crashKindToTelemetryCode)
    expect(codes).toEqual(CRASH_KINDS)
    // If a variant ever fell through to 'unclassified', the counts would
    // silently collapse into one bucket instead of failing loudly.
    expect(codes).not.toContain("unclassified")
  })

  it("falls back rather than inventing a code for an unknown kind", () => {
    expect(crashKindToTelemetryCode("something-new")).toBe("unclassified")
  })
})
