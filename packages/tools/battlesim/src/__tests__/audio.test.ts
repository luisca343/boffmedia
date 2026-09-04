import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_VOLUME,
  playCry,
  preloadCries,
  unlockAudioAutoplay,
  type BattleAudioState,
} from "../engine/BattleAudio";

/**
 * A minimal fake `AudioContext`. jsdom does not implement the Web Audio API,
 * and the real thing is unnecessary here — these tests are about the network
 * / caching state machine around `fetch`, not about actual audio output.
 * Every graph method is a spy so a test can assert playback was (or was not)
 * attempted without caring what the graph looks like.
 */
class FakeAudioContext {
  static instances: FakeAudioContext[] = [];
  state: "running" | "suspended" | "closed" = "running";
  destination = {};
  decodeAudioData = vi.fn(async (_buf: ArrayBuffer) => ({ duration: 1 }) as unknown as AudioBuffer);
  createBufferSource = vi.fn(() => ({
    buffer: null as AudioBuffer | null,
    connect: vi.fn(),
    start: vi.fn(),
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
  }));
  createGain = vi.fn(() => ({
    gain: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }));
  resume = vi.fn(async () => {
    this.state = "running";
  });

  constructor() {
    FakeAudioContext.instances.push(this);
  }
}

const state: BattleAudioState = { volume: DEFAULT_VOLUME, muted: false, autoplayUnlocked: true };

beforeAll(async () => {
  // Same class the browser exposes on `window`; BattleAudio.ts looks it up
  // lazily on first use, so this only needs to be in place once.
  (globalThis as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext = FakeAudioContext;
  // A real gesture would flip this; tests act as if one already happened.
  await unlockAudioAutoplay();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function okResponse(): Response {
  return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) } as unknown as Response;
}

describe("playCry", () => {
  it("never throws or rejects, even when fetch itself blows up", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      })
    );
    await expect(playCry("explodingcrytestmon", state)).resolves.toBeUndefined();
  });

  it("never throws or rejects when decoding fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse()));
    const ctx = FakeAudioContext.instances[0]!;
    ctx.decodeAudioData.mockRejectedValueOnce(new Error("corrupt"));
    await expect(playCry("decodefailcrytestmon", state)).resolves.toBeUndefined();
  });

  it("a real 404 (no cry file) is cached — a second switch-in does not refetch", async () => {
    const fetchMock = vi.fn(async () => ({ ok: false }) as unknown as Response);
    vi.stubGlobal("fetch", fetchMock);

    await playCry("nocryfile404testmon", state);
    await playCry("nocryfile404testmon", state);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a decode failure is cached the same way a 404 is", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
    const ctx = FakeAudioContext.instances[0]!;
    ctx.decodeAudioData.mockRejectedValueOnce(new Error("corrupt"));

    await playCry("decodecachetestmon", state);
    await playCry("decodecachetestmon", state);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("a transient network failure is NOT cached — the next attempt retries", async () => {
    let call = 0;
    const fetchMock = vi.fn(async () => {
      call += 1;
      if (call === 1) throw new Error("network down");
      return okResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    await playCry("transientretrytestmon", state);
    await playCry("transientretrytestmon", state);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falls back from the forme cry to the base cry on a 404", async () => {
    const requested: string[] = [];
    const fetchMock = vi.fn(async (url: string) => {
      requested.push(url);
      // Only the base file ("...zacian.mp3", no forme suffix) exists.
      return { ok: /\/zacian\.mp3$/.test(url) } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await playCry("zacian-crowned", state);

    expect(requested).toHaveLength(2);
    expect(requested[0]).toContain("zacian-crowned.mp3");
    expect(requested[1]).toContain("zacian.mp3");
    const ctx = FakeAudioContext.instances[0]!;
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1); // played the base cry
  });

  it("does nothing (and never fetches) while muted", async () => {
    const fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);

    await playCry("mutedcrytestmon", { ...state, muted: true });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("preloadCries", () => {
  it("fetches every species and never runs more than 4 requests at once", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const fetchMock = vi.fn(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 15));
      inFlight -= 1;
      return okResponse();
    });
    vi.stubGlobal("fetch", fetchMock);

    const species = Array.from({ length: 10 }, (_, i) => `preloadtestmon${i}`);
    preloadCries(species); // fire-and-forget by design — no promise returned

    // Give the bounded workers time to drain the queue.
    await new Promise((resolve) => setTimeout(resolve, 300));

    expect(fetchMock).toHaveBeenCalledTimes(species.length);
    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it("is a no-op that does not throw when called with an empty list", () => {
    expect(() => preloadCries([])).not.toThrow();
  });
});
