import { describe, expect, it } from "vitest";
import { battleSpriteUrl, cryCandidates, cryUrl, spriteIdentityKey } from "../sprites";

/**
 * `cryUrl`/`cryCandidates` resolve real cry files under
 * `apps/web/public/boffmedia/tools/battlesim/audio/cries/{baseid}.mp3` and
 * `{baseid}-{formesuffix}.mp3`. This regressed once already (see the AUDIO
 * section of the audit ledger): the old implementation lowercased and
 * stripped the id verbatim, which strips the hyphen out of every forme cry
 * filename and 404s on all of them. These ids were chosen because they cover
 * every shape that matters: a plain species, a forme with its own recording,
 * and a cosmetic forme that has no recording of its own and must fall back
 * to the base species' cry.
 */
describe("cryUrl / cryCandidates", () => {
  it.each([
    ["hooh", "hooh"],
    ["mrmime", "mrmime"],
    ["porygonz", "porygonz"],
  ])("plain species %s resolves to a single %s.mp3 candidate", (id, base) => {
    expect(cryCandidates(id)).toEqual([expect.stringContaining(`/audio/cries/${base}.mp3`)]);
    expect(cryUrl(id)).toContain(`/audio/cries/${base}.mp3`);
  });

  it.each([
    ["zacian-crowned", "zacian", "crowned"],
    ["urshifu-rapidstrike", "urshifu", "rapidstrike"],
    ["toxtricity-lowkey", "toxtricity", "lowkey"],
    ["necrozma-dawnwings", "necrozma", "dawnwings"],
    ["calyrex-ice", "calyrex", "ice"],
    ["tatsugiri-droopy", "tatsugiri", "droopy"],
  ])("forme %s resolves forme-first with base as fallback", (id, base, formeSuffix) => {
    const candidates = cryCandidates(id);
    expect(candidates).toHaveLength(2);
    expect(candidates[0]).toContain(`/audio/cries/${base}-${formeSuffix}.mp3`);
    expect(candidates[1]).toContain(`/audio/cries/${base}.mp3`);
    // cryUrl always hands back the most specific (first) candidate.
    expect(cryUrl(id)).toBe(candidates[0]);
  });

  it.each([
    ["vivillon-fancy", "vivillon", "fancy"],
    ["florges-blue", "florges", "blue"],
    ["pikachu-original", "pikachu", "original"],
  ])(
    "cosmetic forme %s still lists the (non-existent) forme file first, base second",
    (id, base, formeSuffix) => {
      // Cosmetic formes have no recording of their own — the file at
      // candidates[0] does not exist on disk — but the *shape* of the
      // fallback list must still be [formeUrl, baseUrl] so playback degrades
      // to the shared base cry rather than to silence.
      const candidates = cryCandidates(id);
      expect(candidates).toHaveLength(2);
      expect(candidates[0]).toContain(`/audio/cries/${base}-${formeSuffix}.mp3`);
      expect(candidates[1]).toContain(`/audio/cries/${base}.mp3`);
    }
  );

  it("an unknown id degrades to a single best-effort candidate instead of throwing", () => {
    expect(() => cryCandidates("not-a-real-species-at-all")).not.toThrow();
    expect(cryCandidates("not-a-real-species-at-all")).toHaveLength(1);
  });
});

describe("battleSpriteUrl / spriteIdentityKey", () => {
  const base = {
    speciesForme: "Pikachu",
    side: "p2" as const,
    source: "static" as const,
  };

  it("uses transformedInto instead of speciesForme when present", () => {
    const normal = battleSpriteUrl(base);
    const transformed = battleSpriteUrl({ ...base, transformedInto: "Ditto" });
    expect(normal).not.toBe(transformed);
    expect(transformed).toMatch(/ditto/i);
  });

  it("spriteIdentityKey changes when the rendered species, shiny, gender or side changes", () => {
    const key = spriteIdentityKey(base);
    expect(spriteIdentityKey({ ...base, shiny: true })).not.toBe(key);
    expect(spriteIdentityKey({ ...base, gender: "F" })).not.toBe(key);
    expect(spriteIdentityKey({ ...base, side: "p1" })).not.toBe(key);
    expect(spriteIdentityKey({ ...base, transformedInto: "Ditto" })).not.toBe(key);
  });

  it("spriteIdentityKey is stable for equal input and ignores null vs undefined transformedInto", () => {
    expect(spriteIdentityKey(base)).toBe(spriteIdentityKey({ ...base }));
    expect(spriteIdentityKey({ ...base, transformedInto: null })).toBe(
      spriteIdentityKey({ ...base, transformedInto: undefined })
    );
  });
});
