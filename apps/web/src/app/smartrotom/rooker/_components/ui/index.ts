/**
 * Rooker's primitive library (`rk-*`).
 *
 * Import from this barrel, never by deep path. Add a line here
 * whenever a new primitive is created, and a specimen at
 * `/smartrotom/styles/components`.
 */
export { Icon, type IconName, type IconProps } from "./Icon"
// The wordmark's art lives with the rest of the hand-drawn glyphs; re-exported
// here so rooker code keeps importing it from the barrel like any primitive.
export { RookerMark, type RookerMarkProps } from "@/lib/smartrotom/customIcons"
export { PokeBall, BALL_NAME, type BallVariant, type PokeBallProps } from "./PokeBall"
export { ReactionGlyph, type ReactionGlyphProps } from "./ReactionGlyph"
export { Sprite, type SpriteProps } from "./Sprite"
export { Avatar, type AvatarProps } from "./Avatar"
export { Verified } from "./Verified"
export { Pill, type PillProps } from "./Pill"
export { Button, type ButtonProps } from "./Button"
export { ActionBtn, type ActionBtnProps, type ActionTone } from "./ActionBtn"
export { ReactionControl, type ReactionControlProps } from "./ReactionControl"
export { ReactionSummary } from "./ReactionSummary"
export { RichText, type RichTextProps } from "./RichText"
export { AuthorLine, type AuthorLineProps } from "./AuthorLine"
export { SubHeader, type SubHeaderProps } from "./SubHeader"
export { SegTabs, type SegTab, type SegTabsProps } from "./SegTabs"
export { SearchBar, type SearchBarProps } from "./SearchBar"
export { SectionTitle, type SectionTitleProps } from "./SectionTitle"
export { StatPill, type StatPillProps, type StatTone } from "./StatPill"
export { Modal, type ModalProps } from "./Modal"
export { ToastHost, toast } from "./ToastHost"
export { Skeleton, PostSkeleton, FeedSkeleton } from "./Skeleton"
export { EmptyState, type EmptyStateProps } from "./EmptyState"
export { ThemedLayer } from "./ThemedLayer"
export { CharRing, MAX_CHARS } from "./CharRing"
