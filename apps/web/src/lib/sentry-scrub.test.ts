import { describe, expect, it } from "vitest"
import { scrubSentryEvent, REDACTED, type ScrubbableEvent } from "./sentry-scrub"

describe("scrubSentryEvent (web)", () => {
  it("redacts an email address wherever it appears in free text", () => {
    const out = scrubSentryEvent({
      message: "no account for luisca343@gmail.com",
    } as ScrubbableEvent)
    expect(out?.["message"]).toBe(`no account for ${REDACTED}`)
  })

  // rotom_users.uuid is an FK in 27 tables, so it reaches the browser inside
  // ordinary error text far more often than in a field named `uuid`.
  it("redacts a Minecraft UUID in both the dashed and undashed form", () => {
    expect(
      scrubSentryEvent({
        message: "denied 069a79f4-44e9-4726-a5be-fca90e38aaf5",
      } as ScrubbableEvent)?.["message"],
    ).toBe(`denied ${REDACTED}`)
    expect(
      scrubSentryEvent({
        message: "denied 069a79f444e94726a5befca90e38aaf5",
      } as ScrubbableEvent)?.["message"],
    ).toBe(`denied ${REDACTED}`)
  })

  // The client-specific leak: ?redirect=, ?token= and the OAuth callback params
  // all ride in the URL, and Sentry records URLs in breadcrumbs by default.
  it("drops the query string from a URL but keeps the path", () => {
    const out = scrubSentryEvent({
      message: "GET https://boffmedia.es/entrar?redirect=/pc&token=abc123 failed",
    } as ScrubbableEvent)
    expect(out?.["message"]).toContain("https://boffmedia.es/entrar?")
    expect(out?.["message"]).not.toContain("token=abc123")
  })

  it("redacts a JWT and an IP address", () => {
    const out = scrubSentryEvent({
      message:
        "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.c2lnbmF0dXJl from 203.0.113.9",
    } as ScrubbableEvent)
    expect(out?.["message"]).not.toContain("eyJ")
    expect(out?.["message"]).not.toContain("203.0.113.9")
  })

  // Regression guard: an over-eager IPv6 pattern eats the time out of every log
  // line, which makes the events useless rather than unsafe.
  it("leaves an ISO timestamp alone", () => {
    expect(
      scrubSentryEvent({
        message: "failed at 2026-09-04T12:34:56.789Z",
      } as ScrubbableEvent)?.["message"],
    ).toBe("failed at 2026-09-04T12:34:56.789Z")
  })

  it("drops the request body, cookies and query string outright", () => {
    const out = scrubSentryEvent({
      request: {
        data: { email: "a@b.c", password: "hunter2" },
        cookies: { "next-auth.session-token": "abc" },
        query_string: "token=abc",
      },
    } as ScrubbableEvent)
    expect(out?.request?.data).toBeUndefined()
    expect(out?.request?.cookies).toBeUndefined()
    expect(out?.request?.query_string).toBeUndefined()
  })

  it("keeps only allowlisted request headers", () => {
    const out = scrubSentryEvent({
      request: {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Authorization: "Bearer abc",
          "X-Forwarded-For": "203.0.113.9",
        },
      },
    } as ScrubbableEvent)
    expect(Object.keys(out?.request?.headers ?? {})).toEqual(["User-Agent"])
  })

  it("keeps a numeric user id and drops a uuid or email in that slot", () => {
    expect(
      scrubSentryEvent({ user: { id: 42, email: "a@b.c" } } as ScrubbableEvent)
        ?.user,
    ).toEqual({ id: 42 })
    expect(
      scrubSentryEvent({
        user: { id: "069a79f4-44e9-4726-a5be-fca90e38aaf5" },
      } as ScrubbableEvent)?.user,
    ).toEqual({})
  })

  it("survives a cyclic object graph", () => {
    const cyclic: Record<string, unknown> = { name: "boom" }
    cyclic["self"] = cyclic
    expect(() =>
      scrubSentryEvent({ extra: cyclic } as ScrubbableEvent),
    ).not.toThrow()
  })
})
