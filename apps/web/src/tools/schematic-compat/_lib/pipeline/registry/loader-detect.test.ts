import { describe, expect, it } from "vitest";
import { detectInstance, INSTANCE_META_FILENAMES } from "./loader-detect";

const metas = (entries: Record<string, unknown>) =>
  new Map(
    Object.entries(entries).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]),
  );

describe("detectInstance", () => {
  it("reads a CurseForge runtime instance", () => {
    const info = detectInstance(
      metas({
        "minecraftinstance.json": {
          gameVersion: "1.20.1",
          name: "All the Mods 9",
          baseModLoader: { name: "forge-47.2.0" },
        },
      }),
    );
    expect(info).toMatchObject({ version: "1.20.1", modLoader: "forge", instanceName: "All the Mods 9" });
  });

  it("reads a CurseForge modpack manifest and prefers the primary loader", () => {
    const info = detectInstance(
      metas({
        "manifest.json": {
          name: "Pack",
          minecraft: {
            version: "1.19.2",
            modLoaders: [
              { id: "fabric-0.14", primary: false },
              { id: "neoforge-20.2", primary: true },
            ],
          },
        },
      }),
    );
    expect(info).toMatchObject({ version: "1.19.2", modLoader: "neoforge" });
  });

  it("reads a MultiMC/Prism pack with its loader component and cfg name", () => {
    const info = detectInstance(
      metas({
        "mmc-pack.json": {
          components: [
            { uid: "net.fabricmc.fabric-loader", version: "0.15.11" },
            { uid: "net.minecraft", version: "1.21.1" },
          ],
        },
        "instance.cfg": "InstanceType=OneSix\nname=My Prism Instance\nJavaPath=/usr/bin/java",
      }),
    );
    expect(info).toMatchObject({
      version: "1.21.1",
      modLoader: "fabric",
      instanceName: "My Prism Instance",
    });
  });

  it("reads a Modrinth profile, including the legacy nested shape", () => {
    expect(
      detectInstance(metas({ "profile.json": { game_version: "1.20.4", loader: "quilt", name: "Mod" } })),
    ).toMatchObject({ version: "1.20.4", modLoader: "fabric" });

    expect(
      detectInstance(
        metas({ "profile.json": { metadata: { game_version: "1.21.1", loader: "forge" } } }),
      ),
    ).toMatchObject({ version: "1.21.1", modLoader: "forge" });
  });

  it("reads an ATLauncher instance", () => {
    const info = detectInstance(
      metas({
        "instance.json": { id: "1.18.2", launcher: { name: "Vault Hunters", loaderVersion: { type: "forge" } } },
      }),
    );
    expect(info).toMatchObject({ version: "1.18.2", modLoader: "forge", instanceName: "Vault Hunters" });
  });

  it("ignores an ATLauncher instance.json whose id is not a version", () => {
    // Modrinth also ships an `instance.json` in some layouts; its `id` is a hash.
    expect(detectInstance(metas({ "instance.json": { id: "AbC123xy" } }))).toBeUndefined();
  });

  it("takes the newest release across vanilla launcher profiles", () => {
    const info = detectInstance(
      metas({
        "launcher_profiles.json": {
          profiles: {
            a: { lastVersionId: "1.16.5" },
            b: { lastVersionId: "fabric-loader-0.15.11-1.20.1" },
            c: { lastVersionId: "1.19.2" },
          },
        },
      }),
    );
    expect(info).toMatchObject({ version: "1.20.1", modLoader: "fabric" });
  });

  it("returns undefined when nothing matches, so the UI can prompt", () => {
    expect(detectInstance(metas({}))).toBeUndefined();
    expect(detectInstance(metas({ "manifest.json": { name: "no version here" } }))).toBeUndefined();
    expect(detectInstance(new Map([["minecraftinstance.json", "{ not json"]]))).toBeUndefined();
  });

  it("prefers the more specific layout when several metadata files coexist", () => {
    // A CurseForge pack imported into Prism keeps both files.
    const info = detectInstance(
      metas({
        "minecraftinstance.json": { gameVersion: "1.20.1", baseModLoader: { name: "forge" } },
        "manifest.json": { minecraft: { version: "1.7.10", modLoaders: [{ id: "forge", primary: true }] } },
      }),
    );
    expect(info?.version).toBe("1.20.1");
  });

  it("declares every filename its detectors read", () => {
    for (const name of [
      "minecraftinstance.json",
      "manifest.json",
      "mmc-pack.json",
      "instance.cfg",
      "profile.json",
      "instance.json",
      "launcher_profiles.json",
    ]) {
      expect(INSTANCE_META_FILENAMES).toContain(name);
    }
  });
});
