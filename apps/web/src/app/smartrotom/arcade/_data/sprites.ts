import type { PixelArtSprite } from "../_components/ui"

// Original 16×16 cabinet art — one sprite per game, drawn in the arcade palette.
// Every row must be exactly 16 characters: `PixelArt` sizes the grid from row 0,
// so a short row silently shears the sprite.
const INK = "#eef0ff"
const VOID = "#0a0524"
const CYAN = "#00e5ff"
const MAGENTA = "#ff2e93"
const VIOLET = "#a855ff"
const AMBER = "#ffb845"
const LIME = "#7af8ca"

/** Two tiles of letters — the word game. */
export const SQUIRDLE_SPRITE: PixelArtSprite = {
  legend: { a: CYAN, b: VIOLET, c: MAGENTA, d: AMBER, e: VOID, f: INK },
  bitmap: [
    "................",
    "..eeeeee..eeee..",
    "..eaaaae..ebbe..",
    "..eaffae..ebfbe.",
    "..eaffae..ebfbe.",
    "..eaaaae..ebbbe.",
    "..eeeeee..eeeee.",
    "................",
    "..eeeeee..eeee..",
    "..eccccce.edde..",
    "..ecfffce.edfde.",
    "..ecfffce.edfde.",
    "..eccccce.edddd.",
    "..eeeeee..eeeee.",
    "................",
    "................",
  ],
}

/** A primed orb over its glow — the risk game. */
export const VOLTORB_SPRITE: PixelArtSprite = {
  legend: { a: MAGENTA, b: VOID, c: AMBER, d: VIOLET, e: INK, f: CYAN },
  bitmap: [
    "................",
    "....bbbbbbbb....",
    "..bbaaaaaaaabb..",
    "..baaaaaaaaaab..",
    ".baaccccccccaab.",
    ".bacccddddcccab.",
    ".baccddeeddccab.",
    ".baccdeffedccab.",
    ".baccdeffedccab.",
    ".baccddeeddccab.",
    ".bacccddddcccab.",
    ".baaccccccccaab.",
    "..baaaaaaaaaab..",
    "..bbaaaaaaaabb..",
    "....bbbbbbbb....",
    ".....ffffff.....",
  ],
}

/** Nested chambers closing in — the dungeon crawler. */
export const MAZE_SPRITE: PixelArtSprite = {
  legend: { a: VIOLET, b: VOID, c: INK, d: MAGENTA, f: CYAN },
  bitmap: [
    "bbbbbbbbbbbbbbbb",
    "baaaaaaaaaaaaaab",
    "baccccccccccccab",
    "bacbbbbbbbbbbcab",
    "bacbaaaaaaaabcab",
    "bacbacccccabcab.",
    "bacbacddcabcab..",
    "bacbacddcabcab..",
    "bacbacccabcab...",
    "bacbaaaaabcab...",
    "bacbbbbbbcab....",
    "baccccccccab....",
    "baaaaaaaaaab....",
    "bbbbbbbbbbbb....",
    "................",
    "................",
  ],
}

/** A 3×3 board with three cells filled — the logic game. */
export const TYPEDOKU_SPRITE: PixelArtSprite = {
  legend: { a: CYAN, b: VOID, c: INK, d: VIOLET },
  bitmap: [
    "bbbbbbbbbbbbbbbb",
    "baaaaaaaaaaaaaab",
    "bacccacccacccacb",
    "bacdcacccacdcacb",
    "bacccacccacccacb",
    "baaaaaaaaaaaaaab",
    "bacccacdcacccacb",
    "bacdcacccacdcacb",
    "bacccacccacccacb",
    "baaaaaaaaaaaaaab",
    "bacccacdcacccacb",
    "bacccacccacdcacb",
    "bacccacccacccacb",
    "baaaaaaaaaaaaaab",
    "bbbbbbbbbbbbbbbb",
    "................",
  ],
}

/** A pick striking ore — the mining game. */
export const MINA_SPRITE: PixelArtSprite = {
  legend: { a: AMBER, b: VOID, c: VIOLET, d: INK, e: MAGENTA },
  bitmap: [
    "................",
    "..............aa",
    "............aabb",
    "..........aabb..",
    "........aabb....",
    "......aabb......",
    "....aabb..ccc...",
    "..aabb..ccccccc.",
    "aabb..ccccdcccc.",
    "bb..ccccccddccc.",
    "..ccccdcccddccc.",
    "cccccccccddcccc.",
    "ccccccccddccccc.",
    ".ccccccccccccc..",
    "..cccccccccccc..",
    "...cccccccccc...",
  ],
}

/** Four interlocking pieces — the sliding puzzle. */
export const PUZLE_SPRITE: PixelArtSprite = {
  legend: { a: LIME, b: VOID, c: INK, d: VIOLET, e: MAGENTA },
  bitmap: [
    "................",
    "..aaaaa....ddddd",
    "..ac..ca...dc..d",
    "..ac..caaaadc..d",
    "..ac.....cc..c.d",
    "..acaccaccdcccd.",
    "..aac...c..d..d.",
    "...accc.cc.ddccd",
    "...eeeee....bbbb",
    "...ec..c....bcb.",
    "...ec.cccc..b.b.",
    "...ec.....cccccb",
    "...ec.cccc...b..",
    "...ec..c......b.",
    "...eeeeee.....b.",
    "................",
  ],
}
