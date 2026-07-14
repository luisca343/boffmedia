/**
 * Every hand-drawn SmartRotom glyph lives here — the icons lucide doesn't ship,
 * one file per icon. The `createLucideIcon` ones behave exactly like any lucide
 * import (size/strokeWidth/className), so the app icon maps register them
 * directly; `GoldCoin`, `RookerMark` and `RotomMark` own their art direction and
 * are plain components. Showcased at /smartrotom/styles/components → Sistema · Iconos.
 * Redraw history: docs/audits/ICON_MIGRATION_2026-07-13.md.
 */
export { Mars } from "./Mars"
export { Venus } from "./Venus"
export { Neuter } from "./Neuter"
export { Rotom } from "./Rotom"
export { Gif } from "./Gif"
export { GoldCoin, type GoldCoinProps } from "./GoldCoin"
export { RookerMark, type RookerMarkProps } from "./RookerMark"
export { RotomMark, type RotomMarkProps } from "./RotomMark"
