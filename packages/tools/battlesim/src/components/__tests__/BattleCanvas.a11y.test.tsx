import { describe, it, expect, afterEach, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { Battle } from "@pkmn/client";
import { BattleCanvas } from "../BattleCanvas";
import { feed, openBattle } from "./helpers";
import { messages } from "../../catalog/messages";

/**
 * Resolve against the REAL Spanish catalogue rather than echoing the key.
 *
 * Without this the component renders untranslated key paths in tests, so an
 * assertion on the announced text could never tell a good key from a missing
 * one — and a missing one is exactly the bug this file caught: the region
 * shipped calling `battle.turnAnnounce`, which the catalogue does not define.
 * A key with no entry now throws here instead of silently becoming its own path.
 */
vi.mock("../../i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../i18n")>();
  return {
    ...actual,
    useToolT: (namespace: string) => (key: string, values?: Record<string, unknown>) => {
      const path = `${namespace}.${key}`.split(".");
      let node: unknown = messages.es;
      for (const part of path) {
        node = (node as Record<string, unknown> | undefined)?.[part];
      }
      if (typeof node !== "string") {
        throw new Error(`missing translation key: ${path.join(".")}`);
      }
      return node.replace(/\{(\w+)\}/g, (_m, name: string) =>
        String(values?.[name] ?? `{${name}}`),
      );
    },
  };
});

// See ChatPanel.test.tsx: this package does not set `globals: true`, so
// Testing Library's automatic cleanup never registers.
afterEach(cleanup);

/**
 * What a screen-reader user gets from a canvas battle.
 *
 * The finding (B8) is that the field is a canvas with no accessible
 * alternative. These assert the CONTENT of the live regions and the HP plates,
 * not merely that a region element exists — an empty region announces nothing,
 * and "an aria-live element is present" is exactly the kind of a11y assertion
 * that passes while the feature does nothing.
 */
function renderCanvas(battle: Battle, pov: 0 | 1, revision = 1) {
  return render(
    <BattleCanvas battle={battle} pov={pov} revision={revision} liveMode liveStatus="active" />,
  );
}

/**
 * Everything a screen reader would announce, joined.
 *
 * Deliberately NOT `querySelector` on one region: `bx-kit` already renders its
 * own polite regions for the battle log, so the first match in DOM order is
 * usually somebody else's. Reading them all is both closer to what a user
 * hears and immune to a new region being inserted above this one.
 */
const live = (container: HTMLElement, kind: "polite" | "assertive") =>
  [...container.querySelectorAll(`[aria-live="${kind}"]`)]
    .map((n) => n.textContent?.trim() ?? "")
    .filter(Boolean)
    .join(" | ");

describe("BattleCanvas accessibility", () => {
  it("announces the turn number, and updates it when the turn advances", () => {
    const battle = openBattle();
    feed(battle, ["|turn|1"]);
    const { container, rerender } = renderCanvas(battle, 0);

    const first = live(container, "polite");
    expect(first).not.toBe("");
    expect(first).toContain("1");

    feed(battle, ["|turn|2"]);
    rerender(
      <BattleCanvas battle={battle} pov={0} revision={2} liveMode liveStatus="active" />,
    );

    const second = live(container, "polite");
    expect(second).toContain("2");
  });

  it("announces the active matchup, so a blind player knows what is on the field", () => {
    const battle = openBattle();
    feed(battle, ["|turn|1"]);
    const { container } = renderCanvas(battle, 0);

    const matchup = live(container, "assertive");
    // Both sides named, in one utterance.
    expect(matchup).toMatch(/\w+ vs \w+/);
  });

  it("labels each HP plate with the Pokémon and its remaining HP", () => {
    const battle = openBattle();
    feed(battle, ["|turn|1"]);
    const { container } = renderCanvas(battle, 0);

    const plates = [...container.querySelectorAll('[role="region"]')].map(
      (n) => n.getAttribute("aria-label") ?? "",
    );

    expect(plates.length).toBeGreaterThan(0);
    // A label that omits the number tells a screen reader nothing about how the
    // battle is going, which is the whole point of reading the plate.
    for (const label of plates) {
      expect(label).toMatch(/\d+\/\d+ HP/);
    }
  });

  it("announces a real string, never the translation key itself", () => {
    // This is why the test asserts content: the region first shipped calling
    // `battle.turnAnnounce`, which does not exist in the catalogue, so the
    // translator returned the key path and a screen reader would have read out
    // "tools.battlesim.battle.turnAnnounce".
    const battle = openBattle();
    feed(battle, ["|turn|3"]);
    const { container } = renderCanvas(battle, 0);

    const announced = live(container, "polite");
    expect(announced).not.toMatch(/^tools\./);
    expect(announced).not.toContain("turnAnnounce");
    expect(announced).toContain("3");
  });
});
