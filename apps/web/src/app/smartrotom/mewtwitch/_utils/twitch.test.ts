import { describe, expect, it, vi, afterEach } from "vitest"
import { compactCount, twitchThumb, uptimeFrom } from "./twitch"
import { parseChatMessage } from "../_services/twitchChat"

describe("twitchThumb", () => {
  it("fills width/height placeholders", () => {
    expect(twitchThumb("https://x/{width}x{height}.jpg", 640, 360)).toBe("https://x/640x360.jpg")
  })
  it("is safe on undefined", () => {
    expect(twitchThumb(undefined)).toBe("")
  })
})

describe("compactCount", () => {
  it("formats K and M with comma decimals", () => {
    expect(compactCount(32_400)).toBe("32,4 K")
    expect(compactCount(1_200_000)).toBe("1,2 M")
    expect(compactCount(812)).toBe("812")
  })
})

describe("uptimeFrom", () => {
  afterEach(() => vi.useRealTimers())
  it("computes hours + minutes", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-07-12T18:00:00Z"))
    expect(uptimeFrom("2026-07-12T14:36:00Z")).toBe("3h 24m")
    expect(uptimeFrom("2026-07-12T17:18:00Z")).toBe("42m")
  })
  it("is safe on empty", () => {
    expect(uptimeFrom(undefined)).toBe("")
  })
})

describe("parseChatMessage (IRC)", () => {
  it("parses a PRIVMSG with tags", () => {
    const line =
      "@badges=moderator/1;color=#1E90FF;display-name=Foo;id=abc :foo!foo@foo.tmi.twitch.tv PRIVMSG #chan :hola mundo"
    const m = parseChatMessage(line)
    expect(m).toMatchObject({ id: "abc", user: "Foo", color: "#1E90FF", msg: "hola mundo", mod: true })
  })
  it("falls back to a deterministic colour when none is given", () => {
    const line = "@display-name=Bar;id=x :bar!bar@bar.tmi.twitch.tv PRIVMSG #chan :hey"
    const m = parseChatMessage(line)
    expect(m?.color).toMatch(/^hsl\(/)
  })
  it("marks partner badge as verified", () => {
    const line = "@badges=partner/1;display-name=V;id=y :v!v@v.tmi.twitch.tv PRIVMSG #c :hi"
    expect(parseChatMessage(line)?.verified).toBe(true)
  })
  it("maps USERNOTICE system messages", () => {
    const line = "@system-msg=User\\ssubscribed!;id=z :tmi.twitch.tv USERNOTICE #chan"
    const m = parseChatMessage(line)
    expect(m).toMatchObject({ system: true, msg: "User subscribed!" })
  })
  it("ignores PING and other commands", () => {
    expect(parseChatMessage("PING :tmi.twitch.tv")).toBeNull()
    expect(parseChatMessage(":tmi.twitch.tv 001 justinfan :Welcome")).toBeNull()
  })
})
