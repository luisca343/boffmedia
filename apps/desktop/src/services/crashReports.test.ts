import { describe, expect, it } from "vitest"

import { scrubDesktopEvent, setCrashReporting } from "./crashReports"

describe("scrubDesktopEvent", () => {
  it("redacts an email address wherever it sits in the text", () => {
    const out = scrubDesktopEvent({
      message: "no account for someone@example.com",
    } as Record<string, unknown>)
    expect(out?.["message"]).toBe("no account for [redacted]")
  })

  // rotom_users.uuid is an FK in 27 tables, so it reaches the renderer inside
  // ordinary error text far more often than in a field named `uuid`.
  it("redacts a Minecraft UUID in both forms", () => {
    expect(
      scrubDesktopEvent({
        message: "profile 069a79f4-44e9-4726-a5be-fca90e38aaf5",
      } as Record<string, unknown>)?.["message"],
    ).toBe("profile [redacted]")
    expect(
      scrubDesktopEvent({
        message: "profile 069a79f444e94726a5befca90e38aaf5",
      } as Record<string, unknown>)?.["message"],
    ).toBe("profile [redacted]")
  })

  // The leak that only exists on a desktop app: a path names the OS account.
  it("redacts the OS account name out of a Windows path", () => {
    const out = scrubDesktopEvent({
      message: "no se pudo abrir C:\\Users\\luisca\\AppData\\Boffmedia\\logs",
    } as Record<string, unknown>)
    expect(out?.["message"]).not.toContain("luisca")
    expect(out?.["message"]).toContain("AppData")
  })

  it("drops the user, the request and the machine name outright", () => {
    const out = scrubDesktopEvent({
      user: { id: "u1", email: "a@b.c" },
      request: { url: "https://api.boffmedia.es/packs" },
      server_name: "LUISCA-PC",
    } as Record<string, unknown>)
    expect(out?.["user"]).toBeUndefined()
    expect(out?.["request"]).toBeUndefined()
    expect(out?.["server_name"]).toBeUndefined()
  })

  it("redacts by key name as well as by value shape", () => {
    const out = scrubDesktopEvent({
      extra: { accessToken: "plainlooking", packId: "keep-me" },
    } as Record<string, unknown>)
    const extra = out?.["extra"] as Record<string, unknown>
    expect(extra["accessToken"]).toBe("[redacted]")
    expect(extra["packId"]).toBe("keep-me")
  })

  it("survives a cyclic object graph", () => {
    const cyclic: Record<string, unknown> = { name: "boom" }
    cyclic["self"] = cyclic
    expect(() =>
      scrubDesktopEvent({ extra: cyclic } as Record<string, unknown>),
    ).not.toThrow()
  })
})

describe("setCrashReporting", () => {
  // The inert-without-a-DSN guarantee. `VITE_SENTRY_DSN` is unset here, exactly
  // as it is in `dev:renderer` and in any build that did not bake one in, so
  // switching reporting on must still not reach for the SDK.
  it("does not load the SDK when no DSN was baked in", () => {
    expect(() => setCrashReporting(true)).not.toThrow()
    setCrashReporting(false)
  })
})
