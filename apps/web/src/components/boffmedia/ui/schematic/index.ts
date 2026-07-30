// Boffmedia v3 — schematic kit shared by every schematic tool (compat, viewer).
// Nothing here is conversion-specific and nothing reads a tool's i18n namespace:
// strings arrive as props. Generic pieces (Stepper, DropZone) live in primitives.
export { AssetThumb, type AssetThumbProps, type SchRing, type ThumbRenderer } from "./AssetThumb"
export { AxisSlider, type AxisSliderProps } from "./AxisSlider"
export { BlockThumb, type BlockThumbProps, type PreviewRow } from "./BlockThumb"
export { PreviewEmptyStage } from "./PreviewEmptyStage"
export {
  SchematicFilePicker,
  type SchematicFilePickerLabels,
  type SchematicFilePickerProps,
} from "./SchematicFilePicker"
export {
  WorldIdPicker,
  type WorldIdPickerLabels,
  type WorldIdPickerProps,
} from "./WorldIdPicker"
export { PreviewButton, SwitchGroup, SwitchSegment } from "./PreviewChrome"
export type { PreviewButtonProps, SwitchSegmentProps } from "./PreviewChrome"
export { PreviewShell, type PreviewShellLabels, type PreviewShellProps } from "./PreviewShell"
export {
  SelectionLocateControls,
  type SelectionLocateControlsLabels,
  type SelectionLocateControlsProps,
} from "./SelectionLocateControls"
export { placeholderColor, placeholderGlyph } from "@/lib/schematic/textures/blockTexture"
