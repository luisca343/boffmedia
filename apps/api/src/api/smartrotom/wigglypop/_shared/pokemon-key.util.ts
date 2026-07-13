// A server-side port of apps/web/src/app/smartrotom/pc/_utils/pokemonKey.ts. The two MUST
// agree byte for byte: the web app computes the key when the seller picks a mon out of their
// PC, and the API recomputes it at settlement to prove the seller still holds that very mon.
// If the hashes ever drift, every listing silently fails its custody check.
//
// The Pokémon on the Pixelmon server carry no id — their only address is (box, index), which
// changes the moment one is moved. So we key on a content hash of the fields Pixelmon never
// rewrites: dex, palette, nature, ability and the six IVs. Level, held item, moves, EVs and
// position are deliberately excluded; they change in normal play.

/** cyrb53 — a fast, well-distributed 53-bit string hash. Identical to the web's. */
function cyrb53(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export interface KeyablePokemon {
  dex: number;
  palette?: string | null;
  nature?: string | null;
  ability?: string | null;
  ivs?: number[] | null;
}

export function pokemonKey(p: KeyablePokemon): string {
  const ivs = Array.isArray(p.ivs) ? p.ivs.join(',') : '';
  const parts = [
    p.dex,
    p.palette ?? 'none',
    p.nature ?? '',
    p.ability ?? '',
    ivs,
  ];
  return cyrb53(parts.join('|')).toString(36);
}
