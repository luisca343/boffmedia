import { describe, expect, it } from "vitest";
import {
  mhwildsArmorAsset,
  mhwildsItemAsset,
  mhwildsItemIconAsset,
  mhwildsWeaponAsset,
} from "./assets";
import { getDecorationImagePath } from "../planner/_components/equipment-utils";

describe("mhwildsArmorAsset", () => {
  it("ignores an empty planner slot", () => {
    expect(mhwildsArmorAsset(null)).toBeNull();
  });

  it("does not resolve a slot from a mutable API set id", () => {
    expect(
      mhwildsArmorAsset({ armorSet: { id: 10 }, kind: "chest" }),
    ).toBeNull();
  });

  it("does not resolve a set-level preview from a mutable API set id", () => {
    expect(mhwildsArmorAsset({ armorSet: { id: 10 } })).toBeNull();
  });

  it("does not reconstruct a public path from a game id", () => {
    expect(
      mhwildsArmorAsset({
        armorSet: { id: 153, gameId: 3633 },
        kind: "chest",
      }),
    ).toBeNull();
  });

  it("uses an explicitly joined local path and carries its pack version", () => {
    expect(
      mhwildsArmorAsset({
        armorSet: { id: 70 },
        kind: "head",
        localAssetPath: "gear/armor/ajarakan/waist.png",
        localAssetVersion: "game-test-schema-7",
      }),
    ).toBe(
      "/boffmedia/tools/mhwilds/bestiary/gear/armor/ajarakan/waist.png?v=game-test-schema-7",
    );
  });

  it("does not probe a missing slot once the manifest has marked it absent", () => {
    expect(
      mhwildsArmorAsset({
        armorSet: { id: 153 },
        kind: "head",
        localAssetPath: null,
      }),
    ).toBeNull();
  });
});

describe("mhwildsWeaponAsset", () => {
  it("resolves the manifest-joined named render path", () => {
    expect(
      mhwildsWeaponAsset({
        kind: "bow",
        gameId: 1,
        localAssetPath: "gear/weapons/bow/hope-bow-i.png",
        localAssetVersion: "game-test-schema-7",
      }),
    ).toBe(
      "/boffmedia/tools/mhwilds/bestiary/gear/weapons/bow/hope-bow-i.png?v=game-test-schema-7",
    );
  });

  it("does not manufacture a path from a kind/game id pair", () => {
    expect(mhwildsWeaponAsset({ kind: "bow", gameId: 1 })).toBeNull();
    expect(mhwildsWeaponAsset({ kind: "kinsect", gameId: 1 })).toBeNull();
  });
});

describe("mhwildsItemIconAsset", () => {
  it("maps MHDB colour names to an existing exact glyph", () => {
    expect(mhwildsItemIconAsset("decoration", "vermilion")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/decoration-orange.svg",
    );
    expect(mhwildsItemIconAsset("decoration", "sage-green")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/decoration-light-green.svg",
    );
  });

  it("keeps canonical palette names unchanged", () => {
    expect(mhwildsItemIconAsset("decoration", "dark-purple")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/decoration-dark-purple.svg",
    );
  });

  it("keeps generic unknown item kinds colored without a missing asset", () => {
    expect(mhwildsItemIconAsset("skull", "red")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/monster-part-red.svg",
    );
    expect(mhwildsItemIconAsset("question", "ivory")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/monster-part-light-brown.svg",
    );
    expect(mhwildsItemIconAsset("ammo-basic", "sky")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/slinger-ammo-deep-teal.svg",
    );
    expect(mhwildsItemIconAsset("bottle", "purple")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/bottle-purple.svg",
    );
    expect(mhwildsItemIconAsset("bottle", "blue")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/medicine-blue.svg",
    );
  });

  it("uses semantic decoration colors before slot fallback", () => {
    expect(getDecorationImagePath(2, "emerald")).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/decoration-teal.svg",
    );
    expect(getDecorationImagePath(2, undefined, 20)).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/decoration-purple.svg",
    );
  });
});

describe("mhwildsItemAsset", () => {
  it("resolves an item through its stable game id and named manifest entry", () => {
    expect(
      mhwildsItemAsset(
        {
          gameId: 400,
          icon: { kind: "scale", color: "white" },
        },
        {
          version: "game-test-schema-15",
          items: {
            "400": {
              gameId: "400",
              assetSlug: "guardian-rathalos-scale",
              asset: "items/guardian-rathalos-scale.png",
              assetSource: "game",
            },
          },
        },
      ),
    ).toBe(
      "/boffmedia/tools/mhwilds/bestiary/items/guardian-rathalos-scale.png?v=game-test-schema-15",
    );
  });

  it("falls back to the shared semantic glyph when an item has no asset entry", () => {
    expect(
      mhwildsItemAsset(
        { gameId: 400, icon: { kind: "scale", color: "white" } },
        { version: "game-test-schema-15", items: {} },
      ),
    ).toBe(
      "/boffmedia/tools/mhwilds/bestiary/item-icons/scale-white.svg?v=game-test-schema-15",
    );
  });
});
