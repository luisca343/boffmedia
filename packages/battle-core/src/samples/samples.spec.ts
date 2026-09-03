import { describe, expect, it } from "vitest";
import { Teams, TeamValidator } from "@pkmn/sim";

import { SAMPLE_TEAMS } from "./index.js";
import { BSIM_FORMATS } from "../formats.js";
import { registerBattleMods } from "../mods/register.js";

/**
 * A sample the validator would reject is worse than no sample: it is offered as
 * the bot's team, so the battle fails to start with a problem list the player
 * did not cause and cannot fix.
 *
 * This is not hypothetical. Writing these by hand produced two illegal teams on
 * the first pass — a level-50 VGC squad offered as Doubles OU, and an AG-tagged
 * Miraidon in Ubers — both of which looked entirely plausible.
 */

registerBattleMods();

describe("bundled sample teams", () => {
  const ids = Object.keys(SAMPLE_TEAMS);

  it("ships one for every base-game team format", () => {
    // Custom-mod formats (`custom: true` — champions, teras) are exempt, and
    // not for convenience: each one is a RESTRICTED dex with its own species
    // pool and its own learnsets, so a base-game paste is not merely suboptimal
    // there, it is invalid. Validated: the VGC 2025 sample fails
    // `gen9championsvgc2026regmb` with "Flutter Mane does not exist in Gen 9".
    // Writing legal samples for them means mining each mod's pool, which is
    // real work for little gain — so the play screen handles their absence
    // instead, disabling the launch button with `play.needsTeam` until the
    // player builds a team of their own.
    const teamFormats = BSIM_FORMATS.filter((f) => f.kind === "team" && !f.custom).map((f) => f.id);
    const missing = teamFormats.filter((id) => !ids.includes(id));
    expect(missing).toEqual([]);
  });

  it.each(ids)("%s parses and validates", (format) => {
    const team = Teams.import(SAMPLE_TEAMS[format]);
    expect(team, `${format}: paste did not parse`).not.toBeNull();
    expect(team!.length).toBe(6);

    const problems = new TeamValidator(format).validateTeam(team!);
    expect(problems, `${format}: ${problems?.join(" | ")}`).toBeNull();
  });

  it("packs and unpacks without losing a set", () => {
    for (const format of ids) {
      const team = Teams.import(SAMPLE_TEAMS[format])!;
      const round = Teams.unpack(Teams.pack(team));
      expect(round, `${format}: pack/unpack lost the team`).not.toBeNull();
      expect(round!.length).toBe(team.length);
    }
  });
});
