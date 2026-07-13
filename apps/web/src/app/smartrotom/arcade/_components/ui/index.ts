// The arcade's primitive library (`ar-*`). Import from this barrel, never by
// deep path (SMARTROTOM_V3.md §1). Add a line here whenever a primitive is born,
// and a specimen to /smartrotom/styles/components (§14).

export { Icon, type IconName, type IconProps } from "./Icon"
export { Button, type ArButtonProps, type ArButtonSize, type ArButtonVariant } from "./Button"
export { Panel, type ArPanelProps, type ArPanelTone } from "./Panel"
export { Tag, type ArTagProps, type ArTone } from "./Tag"
export { Corners, type ArCornersProps, type ArCornerTone } from "./Corners"
export { SectionTitle, type ArAccent, type ArSectionTitleProps } from "./SectionTitle"
export { ProgressBar, type ArBarTone, type ArProgressBarProps } from "./ProgressBar"
export { PixelArt, type PixelArtProps, type PixelArtSprite } from "./PixelArt"
export { StatCard, type ArStatTone, type StatCardProps } from "./StatCard"
export { Ring, type ArRingTone, type RingProps } from "./Ring"
export { Modal, type ArModalProps } from "./Modal"
export { Input, type ArInputProps } from "./Input"
export { Switch, type ArSwitchProps } from "./Switch"
export { Segmented, type SegmentedOption, type SegmentedProps } from "./Segmented"
export { Skeleton } from "./Skeleton"
export { ClaimCelebration, type ArCelebrationReward, type ClaimCelebrationProps } from "./ClaimCelebration"

// [deferred] — the arcade has no currency balance, so no screen mounts this; it
// is demo-only in the showcase. See docs/smartrotom/deferred/arcade.md.
export { CoinCounter, type CoinCounterProps } from "./CoinCounter"
