/**
 * The Forge blockstate format ("v1"), used by Minecraft 1.8–1.12 mods.
 *
 * It shares the `assets/<ns>/blockstates/<name>.json` path with the vanilla
 * format but is structured differently, and the difference is not cosmetic:
 * measured across a real 1.12.2 pack, 679 of 880 modded blockstates (77%) are
 * v1. Parsed as vanilla they yield no properties and no texture, so every one
 * of those blocks would fall back to a flat placeholder.
 *
 * ```json
 * { "forge_marker": 1,
 *   "defaults": { "model": "ns:foo", "textures": { "all": "ns:blocks/foo" } },
 *   "variants": {
 *     "normal":  [{}],                                  // not a property
 *     "facing":  { "north": {...}, "south": {...} } } }  // property → values
 * ```
 *
 * Two things differ from vanilla and both matter here: `variants` keys are
 * *property names* (vanilla keys the whole "prop=value,prop=value" combination),
 * and the model/texture pair usually lives in `defaults`, not in the variant.
 */

export interface ForgeVariantEntry {
  model?: string;
  textures?: Record<string, string>;
}

export interface ForgeBlockstateJson {
  forge_marker?: number;
  defaults?: ForgeVariantEntry;
  variants?: Record<string, unknown>;
}

/** Variant keys that name a render case rather than a block property. */
const NON_PROPERTY_KEYS = new Set(["normal", "inventory"]);

export function isForgeBlockstate(json: unknown): json is ForgeBlockstateJson {
  return (
    typeof json === "object" &&
    json !== null &&
    (json as ForgeBlockstateJson).forge_marker === 1
  );
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * `property name → its declared values`, skipping the render-case keys.
 *
 * Note what this deliberately does not do: pre-flattening blocks store their
 * variant as a metadata number, and which property that number maps to lives in
 * the mod's Java (`getStateFromMeta`), never in its assets. So these values
 * describe what the block *has*, not how a legacy `id:meta` pair selects one.
 */
export function forgeStateValues(json: ForgeBlockstateJson): Map<string, string[]> {
  const acc = new Map<string, Set<string>>();
  const add = (prop: string, value: string) => {
    if (!prop || !value) return;
    let set = acc.get(prop);
    if (!set) acc.set(prop, (set = new Set()));
    set.add(value);
  };

  for (const [key, value] of Object.entries(json.variants ?? {})) {
    if (NON_PROPERTY_KEYS.has(key)) continue;
    // v1 permits BOTH spellings, and mods mix them freely: a property name
    // whose value maps each state value to an entry ("facing": {"north": …}),
    // or a vanilla-style combination key ("variant=stone_slate").
    if (key.includes("=")) {
      for (const pair of key.split(",")) {
        const eq = pair.indexOf("=");
        if (eq > 0) add(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
      }
    } else if (isPlainObject(value)) {
      for (const v of Object.keys(value)) add(key, v);
    }
  }

  const out = new Map<string, string[]>();
  for (const [prop, values] of acc) out.set(prop, [...values]);
  return out;
}

/**
 * First concrete variant entry declared, used as the block's representative look.
 *
 * A variant's value takes three shapes in the wild and all three carry the
 * block's real textures, so all three have to be walked: the entry itself, a
 * list of entries (Quark writes `"variant=stone_slate": [{ textures: … }]`), or
 * — under a property-name key — a map of state value to entry.
 */
function firstVariantEntry(json: ForgeBlockstateJson): ForgeVariantEntry | undefined {
  for (const [key, value] of Object.entries(json.variants ?? {})) {
    const candidates: unknown[] = Array.isArray(value)
      ? value
      : NON_PROPERTY_KEYS.has(key) || key.includes("=")
        ? [value]
        : isPlainObject(value)
          ? Object.values(value)
          : [];
    for (const candidate of candidates) {
      const entry = Array.isArray(candidate) ? candidate[0] : candidate;
      if (isPlainObject(entry) && (entry.model || entry.textures)) {
        return entry as ForgeVariantEntry;
      }
    }
  }
  return undefined;
}

/**
 * Every variant entry in DECLARATION ORDER, merged with `defaults`.
 *
 * Pre-flattening metadata usually indexes this list: `quark:crystal` declares
 * `variant=crystal_white, crystal_red, crystal_orange, crystal_yellow,
 * crystal_green…` and meta 4 is the green one. The real mapping lives in the
 * mod's `getStateFromMeta`, so this is a heuristic — but it is right for the
 * ordinary enum-property block, and the alternative is showing variant 0 for
 * every metadata value (all 8 crystals white, all 16 wools the same).
 */
export function forgeVariantEntries(json: ForgeBlockstateJson): ForgeVariantEntry[] {
  const out: ForgeVariantEntry[] = [];
  const push = (candidate: unknown) => {
    const entry = Array.isArray(candidate) ? candidate[0] : candidate;
    if (!isPlainObject(entry)) return;
    out.push({
      model: (entry.model as string | undefined) ?? json.defaults?.model,
      textures: { ...(json.defaults?.textures ?? {}), ...((entry.textures as Record<string, string>) ?? {}) },
    });
  };

  for (const [key, value] of Object.entries(json.variants ?? {})) {
    if (NON_PROPERTY_KEYS.has(key)) continue;
    if (key.includes("=")) push(value);
    else if (isPlainObject(value)) for (const v of Object.values(value)) push(v);
  }
  return out;
}

/**
 * The model ref and texture overrides that represent this block: `defaults`
 * merged with the first variant that names either (variant wins). Returning the
 * textures separately matters — in v1 the model is often a shared vanilla
 * parent (`cube_all`) whose real textures are only declared here.
 */
export function forgeRepresentative(json: ForgeBlockstateJson): ForgeVariantEntry {
  const variant = firstVariantEntry(json) ?? {};
  return {
    model: variant.model ?? json.defaults?.model,
    textures: { ...(json.defaults?.textures ?? {}), ...(variant.textures ?? {}) },
  };
}
