import { describe, expect, it } from "vitest";
import type { PackEntry } from "../services/types";
import {
  appReducer,
  createAppInitialState,
  type AppState,
  type AppAction,
} from "./appReducer";
import { MOCK_SETTINGS } from "../services/mock";

// Helper to create a minimal initial state for testing
function createInitialState(): AppState {
  return createAppInitialState(MOCK_SETTINGS);
}

// Helper to create a pack entry for testing (minimal fixture)
function createPackEntry(id: string, name: string): PackEntry {
  return {
    pack: {
      id,
      slug: id,
      name,
      summary: "",
      description: "",
      iconUrl: "",
      gallery: [],
      gameType: "minecraft",
      author: "",
      tags: [],
    },
    latest: null,
    state: { kind: "not-installed" },
    lastPlayed: null,
    origin: "local",
  } as unknown as PackEntry;
}

describe("appReducer", () => {
  describe("negative test - install/progress pack isolation", () => {
    it("NEGATIVE: install/progress must write to the correct packId (breaks if packId matching is removed)", () => {
      let state = createInitialState();
      const packA = "pack-a";
      const packB = "pack-b";

      state = {
        ...state,
        packs: [
          createPackEntry(packA, "Pack A"),
          createPackEntry(packB, "Pack B"),
        ],
      };

      // Start install on pack B
      state = appReducer(state, { type: "install/start", packId: packB });

      // Critical: Progress event for packA should NOT modify packB's state
      // This test WILL FAIL if the reducer ignores packId matching
      const beforeState = JSON.parse(JSON.stringify(state));

      state = appReducer(state, {
        type: "install/progress",
        packId: packA, // Wrong pack!
        phase: "java",
        fraction: 0.9,
        file: "wrong-pack.zip",
        downloadedBytes: 9000,
        totalBytes: 10000,
      });

      const bPack = state.packs.find((p) => p.pack.id === packB);

      // PackB's state must be unchanged
      if (bPack?.state.kind === "installing") {
        expect(bPack.state.progress.phase).toBe("resolving");
        expect(bPack.state.progress.fraction).toBe(0);
        expect(bPack.state.progress.currentFile).toBe("");
      }
    });
  });

  describe("install state machine", () => {
    it("starts install with resolving phase", () => {
      let state = createInitialState();
      const packId = "pack-a";
      state = { ...state, packs: [createPackEntry(packId, "Pack A")] };

      state = appReducer(state, { type: "install/start", packId });

      const pack = state.packs.find((p) => p.pack.id === packId);
      expect(pack?.state.kind).toBe("installing");
      if (pack?.state.kind === "installing") {
        expect(pack.state.progress.phase).toBe("resolving");
        expect(pack.state.progress.fraction).toBe(0);
      }
    });

    it("updates install progress for the correct pack", () => {
      let state = createInitialState();
      const packId = "pack-a";
      state = { ...state, packs: [createPackEntry(packId, "Pack A")] };

      state = appReducer(state, { type: "install/start", packId });
      state = appReducer(state, {
        type: "install/progress",
        packId,
        phase: "java",
        fraction: 0.5,
        file: "file.zip",
        downloadedBytes: 1000,
        totalBytes: 2000,
      });

      const pack = state.packs.find((p) => p.pack.id === packId);
      if (pack?.state.kind === "installing") {
        expect(pack.state.progress.phase).toBe("java");
        expect(pack.state.progress.fraction).toBe(0.5);
        expect(pack.state.progress.currentFile).toBe("file.zip");
        expect(pack.state.progress.downloadedBytes).toBe(1000);
        expect(pack.state.progress.totalBytes).toBe(2000);
      }
    });

    it("marks install as installed on install/state", () => {
      let state = createInitialState();
      const packId = "pack-a";
      state = { ...state, packs: [createPackEntry(packId, "Pack A")] };

      state = appReducer(state, { type: "install/start", packId });
      state = appReducer(state, {
        type: "install/state",
        packId,
        state: { kind: "installed", versionId: "v1", sizeBytes: 1000000 },
      });

      const pack = state.packs.find((p) => p.pack.id === packId);
      expect(pack?.state.kind).toBe("installed");
    });

    it("marks install as broken on error", () => {
      let state = createInitialState();
      const packId = "pack-a";
      state = { ...state, packs: [createPackEntry(packId, "Pack A")] };

      state = appReducer(state, { type: "install/start", packId });
      state = appReducer(state, {
        type: "install/state",
        packId,
        state: { kind: "broken", reason: "Download failed" } as any,
      });

      const pack = state.packs.find((p) => p.pack.id === packId);
      expect(pack?.state.kind).toBe("broken");
      if (pack?.state.kind === "broken") {
        expect(pack.state.reason).toBe("Download failed");
      }
    });
  });

  describe("stale event isolation (critical for D1)", () => {
    it("install/progress for pack A does not affect pack B", () => {
      let state = createInitialState();
      const packA = "pack-a";
      const packB = "pack-b";
      state = {
        ...state,
        packs: [
          createPackEntry(packA, "Pack A"),
          createPackEntry(packB, "Pack B"),
        ],
      };

      // Start install on pack B
      state = appReducer(state, { type: "install/start", packId: packB });

      // Stale progress event for pack A should not change pack B
      state = appReducer(state, {
        type: "install/progress",
        packId: packA,
        phase: "java",
        fraction: 0.5,
        file: "file.zip",
        downloadedBytes: 1000,
        totalBytes: 2000,
      });

      const bPack = state.packs.find((p) => p.pack.id === packB);
      expect(bPack?.state.kind).toBe("installing");
      if (bPack?.state.kind === "installing") {
        // Pack B should still be in resolving, not affected by pack A's progress
        expect(bPack.state.progress.phase).toBe("resolving");
        expect(bPack.state.progress.fraction).toBe(0);
      }
    });

    it("install/state for pack A does not affect pack B's state", () => {
      let state = createInitialState();
      const packA = "pack-a";
      const packB = "pack-b";
      state = {
        ...state,
        packs: [
          createPackEntry(packA, "Pack A"),
          createPackEntry(packB, "Pack B"),
        ],
      };

      // Start install on both
      state = appReducer(state, { type: "install/start", packId: packA });
      state = appReducer(state, { type: "install/start", packId: packB });

      // Stale completion event for pack A
      state = appReducer(state, {
        type: "install/state",
        packId: packA,
        state: { kind: "installed", versionId: "v1", sizeBytes: 100 } as any,
      });

      // Pack B should remain installing, not be affected
      const bPack = state.packs.find((p) => p.pack.id === packB);
      expect(bPack?.state.kind).toBe("installing");
    });

    it("pack/played for pack A does not affect pack B", () => {
      let state = createInitialState();
      const packA = "pack-a";
      const packB = "pack-b";
      state = {
        ...state,
        packs: [
          { ...createPackEntry(packA, "Pack A"), lastPlayed: null },
          { ...createPackEntry(packB, "Pack B"), lastPlayed: null },
        ],
      };

      const now = new Date().toISOString();
      state = appReducer(state, {
        type: "pack/played",
        packId: packA,
        at: now,
      });

      const aPack = state.packs.find((p) => p.pack.id === packA);
      const bPack = state.packs.find((p) => p.pack.id === packB);

      expect(aPack?.lastPlayed).toBe(now);
      expect(bPack?.lastPlayed).toBeNull();
    });
  });

  describe("game state transitions", () => {
    it("transitions to preparing when launching", () => {
      let state = createInitialState();
      expect(state.game.kind).toBe("idle");

      state = appReducer(state, {
        type: "game/state",
        game: { kind: "preparing" },
      });

      expect(state.game.kind).toBe("preparing");
    });

    it("transitions to running with pid and timestamp", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "game/state",
        game: { kind: "running", pid: 12345, since: 1000 },
      });

      expect(state.game.kind).toBe("running");
      if (state.game.kind === "running") {
        expect(state.game.pid).toBe(12345);
        expect(state.game.since).toBe(1000);
      }
    });

    it("transitions to crashed with exit code", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "game/state",
        game: { kind: "crashed", exitCode: 1, diagnosis: null },
      });

      expect(state.game.kind).toBe("crashed");
      if (state.game.kind === "crashed") {
        expect(state.game.exitCode).toBe(1);
      }
    });

    it("transitions back to idle", () => {
      let state = createInitialState();
      state = appReducer(state, {
        type: "game/state",
        game: { kind: "running", pid: 123, since: 100 },
      });

      state = appReducer(state, { type: "game/state", game: { kind: "idle" } });

      expect(state.game.kind).toBe("idle");
    });
  });

  describe("boff account switching", () => {
    it("boff/switched clears packs and game state", () => {
      let state = createInitialState();
      state = {
        ...state,
        packs: [createPackEntry("pack-a", "Pack A")],
        game: { kind: "running", pid: 123, since: 100 },
        logs: [{ ts: 100, level: "info", source: "app", text: "test" }],
      };

      state = appReducer(state, {
        type: "boff/switched",
        account: {
          id: 2,
          username: "other",
          avatarUrl: null,
          roles: [],
          mcUuid: "test-uuid-2",
        },
      });

      expect(state.packs).toEqual([]);
      expect(state.game.kind).toBe("idle");
      expect(state.logs).toEqual([]);
      expect(state.boffAccount?.id).toBe(2);
    });

    it("boff/switched resets pack view but keeps other views", () => {
      let state = createInitialState();
      state = {
        ...state,
        view: "pack",
        selectedPackId: "pack-a",
      };

      state = appReducer(state, {
        type: "boff/switched",
        account: {
          id: 2,
          username: "other",
          avatarUrl: null,
          roles: [],
          mcUuid: "test-uuid-2",
        },
      });

      expect(state.view).toBe("packs");
      expect(state.selectedPackId).toBeNull();
    });

    it("boff/switched keeps tools view", () => {
      let state = createInitialState();
      state = { ...state, view: "tools" };

      state = appReducer(state, {
        type: "boff/switched",
        account: {
          id: 2,
          username: "other",
          avatarUrl: null,
          roles: [],
          mcUuid: "test-uuid-2",
        },
      });

      expect(state.view).toBe("tools");
    });
  });

  describe("boot gates", () => {
    it("boot/done part auth opens auth gate", () => {
      let state = createInitialState();
      expect(state.bootAuthDone).toBe(false);

      state = appReducer(state, { type: "boot/done", part: "auth" });

      expect(state.bootAuthDone).toBe(true);
      expect(state.bootSettingsDone).toBe(false);
      expect(state.bootPacksDone).toBe(false);
    });

    it("boot/done part settings opens settings gate", () => {
      let state = createInitialState();
      state = appReducer(state, { type: "boot/done", part: "settings" });

      expect(state.bootSettingsDone).toBe(true);
      expect(state.bootAuthDone).toBe(false);
    });

    it("boot/done part packs opens packs gate", () => {
      let state = createInitialState();
      state = appReducer(state, { type: "boot/done", part: "packs" });

      expect(state.bootPacksDone).toBe(true);
      expect(state.bootAuthDone).toBe(false);
    });
  });

  describe("cancellation scenarios", () => {
    it("boff/cancel clears device code and signing flag", () => {
      let state = createInitialState();
      state = {
        ...state,
        boffSigningIn: true,
        boffDeviceCode: {
          userCode: "ABC-DEF",
          verificationUri: "https://example.com",
          expiresIn: 600,
          intervalSeconds: 5,
        },
      };

      state = appReducer(state, { type: "boff/cancel", message: "User cancelled" });

      expect(state.boffSigningIn).toBe(false);
      expect(state.boffDeviceCode).toBeNull();
      expect(state.boffError).toBe("User cancelled");
    });

    it("signin/cancel clears device code and signing flag", () => {
      let state = createInitialState();
      state = {
        ...state,
        signingIn: true,
        deviceCode: {
          userCode: "ABC-DEF",
          verificationUri: "https://example.com",
          expiresInSeconds: 600,
        },
      };

      state = appReducer(state, { type: "signin/cancel" });

      expect(state.signingIn).toBe(false);
      expect(state.deviceCode).toBeNull();
    });
  });

  describe("backend status", () => {
    it("backend/status ok dismisses banner", () => {
      let state = createInitialState();
      state = { ...state, backendNoticeDismissed: true };

      state = appReducer(state, {
        type: "backend/status",
        status: "ok",
      });

      expect(state.backendStatus).toBe("ok");
      expect(state.backendNoticeDismissed).toBe(false);
    });

    it("backend/status unreachable keeps dismissed flag", () => {
      let state = createInitialState();
      state = { ...state, backendNoticeDismissed: true };

      state = appReducer(state, {
        type: "backend/status",
        status: "unreachable",
        detail: "Connection timeout",
      });

      expect(state.backendStatus).toBe("unreachable");
      expect(state.backendNoticeDismissed).toBe(true);
      expect(state.backendDetail).toBe("Connection timeout");
    });
  });

  describe("packs loading", () => {
    it("packs/loading sets loading flag", () => {
      let state = createInitialState();
      state = appReducer(state, { type: "packs/loading" });

      expect(state.packsLoading).toBe(true);
      expect(state.packsError).toBeNull();
    });

    it("packs/load updates list and clears error", () => {
      let state = createInitialState();
      state = { ...state, packsLoading: true, packsError: "Previous error" };

      const packs = [createPackEntry("pack-1", "Pack 1")];
      state = appReducer(state, {
        type: "packs/load",
        packs,
        registryError: null,
      });

      expect(state.packs).toEqual(packs);
      expect(state.packsLoading).toBe(false);
      expect(state.packsError).toBeNull();
    });

    it("packs/load preserves partial error on partial load", () => {
      let state = createInitialState();

      const packs = [createPackEntry("local", "Local Pack")];
      state = appReducer(state, {
        type: "packs/load",
        packs,
        registryError: "Managed packs unavailable",
      });

      expect(state.packs).toEqual(packs);
      expect(state.packsPartial).toBe("Managed packs unavailable");
      expect(state.packsError).toBeNull();
    });

    it("packs/error keeps existing list", () => {
      let state = createInitialState();
      const oldPacks = [createPackEntry("pack-old", "Old Pack")];
      state = { ...state, packs: oldPacks, packsLoading: true };

      state = appReducer(state, {
        type: "packs/error",
        message: "Failed to load",
      });

      expect(state.packs).toEqual(oldPacks);
      expect(state.packsLoading).toBe(false);
      expect(state.packsError).toBe("Failed to load");
    });
  });

  describe("view navigation", () => {
    it("view action changes view and selects pack", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "view",
        view: "pack",
        packId: "pack-a",
      });

      expect(state.view).toBe("pack");
      expect(state.selectedPackId).toBe("pack-a");
    });

    it("view action can open tool", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "view",
        view: "tool",
        toolId: "tool-abc",
      });

      expect(state.view).toBe("tool");
      expect(state.selectedToolId).toBe("tool-abc");
    });

    it("editIntent is set when view opens with edit flag", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "view",
        view: "pack",
        packId: "pack-a",
        edit: true,
      });

      expect(state.editIntent).toBe(true);
    });

    it("editIntent/clear resets the flag", () => {
      let state = createInitialState();
      state = { ...state, editIntent: true };

      state = appReducer(state, { type: "editIntent/clear" });

      expect(state.editIntent).toBe(false);
    });
  });

  describe("install/progress correctness", () => {
    it("progress updates only affect the targeted pack", () => {
      let state = createInitialState();
      const packA = "pack-a";
      const packB = "pack-b";

      state = {
        ...state,
        packs: [
          createPackEntry(packA, "Pack A"),
          createPackEntry(packB, "Pack B"),
        ],
      };

      // Start both
      state = appReducer(state, { type: "install/start", packId: packA });
      state = appReducer(state, { type: "install/start", packId: packB });

      // Update only A's progress multiple times
      for (let i = 1; i <= 5; i++) {
        state = appReducer(state, {
          type: "install/progress",
          packId: packA,
          phase: "java",
          fraction: i * 0.2,
          file: `file-${i}.zip`,
          downloadedBytes: i * 100,
          totalBytes: 500,
        });
      }

      const aPack = state.packs.find((p) => p.pack.id === packA);
      const bPack = state.packs.find((p) => p.pack.id === packB);

      // A should have the latest progress
      if (aPack?.state.kind === "installing") {
        expect(aPack.state.progress.fraction).toBe(1.0);
        expect(aPack.state.progress.currentFile).toBe("file-5.zip");
      }

      // B should still be in initial resolving state
      if (bPack?.state.kind === "installing") {
        expect(bPack.state.progress.phase).toBe("resolving");
        expect(bPack.state.progress.fraction).toBe(0);
      }
    });
  });

  describe("system selection", () => {
    it("system/select changes selected system", () => {
      let state = createInitialState();

      state = appReducer(state, {
        type: "system/select",
        system: "minecraft",
      });

      expect(state.selectedSystem).toBe("minecraft");
    });

    it("system/select can reset to All", () => {
      let state = createInitialState();
      state = { ...state, selectedSystem: "minecraft" };

      state = appReducer(state, {
        type: "system/select",
        system: "All",
      });

      expect(state.selectedSystem).toBe("All");
    });
  });
});
