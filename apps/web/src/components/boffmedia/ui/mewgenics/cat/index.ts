// Public exports for Mewgenics cat compositor

export { MewCat } from "./MewCat"
export {
  type CatCompositorProps,
  type CatParts,
  type CatEquipment,
  type CatPartsData,
  type CatPartsPlacements,
  type PlacementEntry,
  type RigMatrix,
  type PartBoundsRect,
} from "./types"
export { loadCatPartsPlacements, loadCatPartsManifest, loadCatPartsFrames, mewCatSvgUrl, mewPaletteUrl } from "./data-loader"
export type { CatPartsFrameIndex } from "./data-loader"
export { mewStoryCatAppearance, MEW_DEFAULT_CAT_PARTS, MEW_DEFAULT_PALETTE } from "./story-cat"
