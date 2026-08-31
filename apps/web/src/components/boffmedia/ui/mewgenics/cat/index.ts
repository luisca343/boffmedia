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
export { loadCatPartsPlacements, loadCatPartsManifest, mewCatSvgUrl, mewPaletteUrl } from "./data-loader"
