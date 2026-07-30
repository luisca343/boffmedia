/**
 * Store-free 3D render layer. Everything here is driven by props: mount
 * {@link SchematicView} with block instance data and a handful of callbacks and
 * you get the build on screen. Diff-aware rendering is opt-in through
 * {@link RenderOverrides}, so a read-only viewer never imports a conversion
 * concept.
 *
 * Kept out of the `@/lib/schematic` barrel — that barrel is imported by the
 * worker, and React/three must never reach the worker bundle.
 */

export { SchematicView, type SchematicViewProps } from "./SchematicView";
export {
  SchematicScene,
  type AssetLoaders,
  type RenderEnvironment,
  type RenderOverrides,
  type SchematicSceneProps,
} from "./scene";
export {
  BlockInstances,
  type BlockInstancesProps,
  type BlockVariant,
  type BlockVariantResolver,
} from "./block-instances";
export { LittleTileHighlight, type LittleTileHighlightProps } from "./littletile-highlight";
export { CameraRig, FlyRig, type FlyRigProps } from "./camera-rigs";
export { FocusRig, type FocusGoal, type FocusRigProps } from "./focus-rig";
export { SelectionOverlay, type SelectionOverlayProps } from "./selection-overlay";
export {
  FOCUS_SPAN,
  cameraGoalFor,
  cycleIndex,
  instanceCenterAt,
  instanceCenterInGroup,
  instanceCounts,
  navigableCount,
  structureCenterOf,
  type FocusRequest,
  type InstanceCounts,
} from "./focus-target";
export { FlyHud, useFlyHud, type FlyHudLabels, type FlyHudRefs } from "./fly-hud";
export { sourcePlan, type RenderKind, type RenderPlan } from "./render-plan";
export { makeMaterial, styleParams, surfaceColor, type StyleParams } from "./material";
export { useInstanceMatrices } from "./instance-matrices";
export { useBlockModel } from "./useBlockModel";
export { useBlockTexture } from "./useBlockTexture";
export { buildBlockModel, type BuiltGroup, type BuiltModel } from "./blockModelCache";
export { getBlockTexture, getTextureByCandidates } from "./blockTextureCache";
export {
  buildPickIndex,
  cutoffCount,
  ddaPick,
  maxSliceCount,
  sliceRange,
  type PickIndex,
  type Vec3,
} from "./picking";
export { fluidColor } from "./fluid-color";
export {
  SchematicAssetProvider,
  useConnectionsLoader,
  useModelLoader,
  useTextureLoader,
  type ConnectionsLoader,
  type ModelLoader,
  type TextureLoader,
} from "./assetLoaders";
