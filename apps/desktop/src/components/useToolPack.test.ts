// @vitest-environment happy-dom
//
// renderHook needs a DOM; this package runs vitest in node by default.
// happy-dom, not jsdom: the hoisted jsdom in this workspace pulls the ESM-only
// @exodus/bytes through html-encoding-sniffer and throws ERR_REQUIRE_ESM.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The dataPack handler itself, not the manifest that declares it.
 *
 * The first version of this file only asserted properties of the mewgenics
 * manifest constant — `tool.dataPack?.id === "mewgenics"` and friends — so
 * deleting this hook, which IS the host handling T1 is about, would not have
 * failed it.
 *
 * The owner rule under test: a data pack is a SILENT background optimisation,
 * never a prerequisite and never a gate. Offline, a failed status call and a
 * failed install must all end in "keep streaming", never in a throw.
 */

const toolPacksStatus = vi.fn();
const toolPacksInstall = vi.fn();
const isDesktop = vi.fn(() => true);

// Partial mock: the module has many other exports the hook's neighbours use,
// and a bare factory would break them ("No 'onPackDone' export is defined").
vi.mock("../runtime", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    toolPacksStatus: (...args: unknown[]) => toolPacksStatus(...args),
    toolPacksInstall: (...args: unknown[]) => toolPacksInstall(...args),
    isDesktop: () => isDesktop(),
  };
});

const flush = () => new Promise<void>((r) => setTimeout(r, 0));

async function runHook(toolId: string | undefined) {
  const { renderHook } = await import("@testing-library/react");
  const { useToolPack } = await import("./useToolPack");
  const view = renderHook(() => useToolPack(toolId));
  await flush();
  return view;
}

describe("useToolPack · the dataPack handler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    isDesktop.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("installs a pack that is available and not yet installed", async () => {
    toolPacksStatus.mockResolvedValue({
      available: { version: "v2" },
      installed: null,
    });
    toolPacksInstall.mockResolvedValue(undefined);

    await runHook("mewgenics");

    expect(toolPacksInstall).toHaveBeenCalledWith("mewgenics");
  });

  it("installs when the version DIFFERS, not merely when it is greater", async () => {
    // A pack version is `<dataset>-<content hash>`, and a hash does not order:
    // a `>` comparison would read a lower-sorting rebuild as "already current"
    // and the fix would never reach the player.
    toolPacksStatus.mockResolvedValue({
      available: { version: "data-aaa" },
      installed: { version: "data-zzz" },
    });
    toolPacksInstall.mockResolvedValue(undefined);

    await runHook("mewgenics");

    expect(toolPacksInstall).toHaveBeenCalledWith("mewgenics");
  });

  it("does nothing when the installed pack is already current", async () => {
    toolPacksStatus.mockResolvedValue({
      available: { version: "v2" },
      installed: { version: "v2" },
    });

    await runHook("mewgenics");

    expect(toolPacksInstall).not.toHaveBeenCalled();
  });

  it("keeps streaming when offline instead of attempting an install", async () => {
    // `available: null` means the index was unreachable.
    toolPacksStatus.mockResolvedValue({ available: null, installed: null });

    await runHook("mewgenics");

    expect(toolPacksInstall).not.toHaveBeenCalled();
  });

  it("swallows a failed status call — a pack is never a prerequisite", async () => {
    toolPacksStatus.mockRejectedValue(new Error("index unreachable"));

    await expect(runHook("mewgenics")).resolves.toBeDefined();
    expect(toolPacksInstall).not.toHaveBeenCalled();
  });

  it("swallows a failed install, so the tool still renders", async () => {
    toolPacksStatus.mockResolvedValue({
      available: { version: "v2" },
      installed: null,
    });
    toolPacksInstall.mockRejectedValue(new Error("disk full"));

    await expect(runHook("mewgenics")).resolves.toBeDefined();
  });

  it("does nothing at all for a tool that declares no pack", async () => {
    await runHook(undefined);

    expect(toolPacksStatus).not.toHaveBeenCalled();
    expect(toolPacksInstall).not.toHaveBeenCalled();
  });

  it("does nothing in a browser, where there is no pack store", async () => {
    isDesktop.mockReturnValue(false);
    toolPacksStatus.mockResolvedValue({ available: { version: "v2" }, installed: null });

    await runHook("mewgenics");

    expect(toolPacksStatus).not.toHaveBeenCalled();
  });
});
