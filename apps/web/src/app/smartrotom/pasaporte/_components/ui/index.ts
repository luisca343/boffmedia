/**
 * Pasaporte's primitive library (`ps-*`). Chapters import from here and nowhere else.
 *
 * Every primitive belongs to exactly ONE of the app's two surfaces — the dark DESK the
 * book lies on, or the light PAPER inside it — and says which at the top of its file.
 * Desk ink on paper (and the reverse) renders invisible, so the split is load-bearing.
 */

// ── The desk ────────────────────────────────────────────────────────────────
export { Button, IconButton, type ButtonProps } from "./Button"
export { Icon, type IconName, type IconProps } from "./Icon"
export { InspectOverlay } from "./InspectOverlay"
export { Modal, Overlay } from "./Modal"
export { NavButton, type NavButtonProps } from "./NavButton"
export { ThemedLayer } from "./ThemedLayer"
export { ToastHost, toast } from "./ToastHost"
export { VerifyBadge } from "./VerifyBadge"

// ── The paper ───────────────────────────────────────────────────────────────
export { Bar } from "./Bar"
export { Card, Stat } from "./Card"
export { CircuitTag, PtsChip, RarityBadge } from "./Chip"
export { EmptyState } from "./EmptyState"
export { Folio } from "./Folio"
export { HoloStamp } from "./HoloStamp"
export { Medal } from "./Medal"
export { Mrz } from "./Mrz"
export { PageHead } from "./PageHead"
export { Paper } from "./Paper"
export { SectionLabel } from "./SectionLabel"
export { Skeleton } from "./Skeleton"
export { Sprite } from "./Sprite"
export { TypePill } from "./TypePill"
export { WaxSeal } from "./WaxSeal"
