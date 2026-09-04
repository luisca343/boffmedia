// The PC's skin layer. These are NOT duplicates of `@/components/smartrotom/ui` —
// that barrel is the `sr-*` phone chrome (neobrutalist cut/slant), while each app on
// the phone is its own skin with its own token namespace declared in
// `tailwind.config.ts`: the PC is `pc-*` (dark glass), Wigglypop `wp-*`, Rooker `rk-*`,
// Misiones `ms-*`, and so on for fifteen scopes. Promoting these into the shared
// barrel would either strand it on tokens that only exist under `.pc-app`, or restyle
// the PC into chrome it was deliberately not built in.
//
// The sharing seam is BEHAVIOUR, not skin, and it is already wired: `Modal` renders
// `behavior/ModalShell` (focus trap, Escape, portal — hence its `scope` prop, so
// portaled content keeps `pc-*`), `Toast` renders `behavior/toast`'s store, `Icon` is
// `behavior/makeIconComponent` over a PC-local glyph map, and `Sprite` resolves through
// the shared sprite manifest. Anything genuinely reusable here has already moved; what
// is left is what makes the PC look like the PC.
export { Button, type ButtonProps } from "./Button"
export { Chip, ChipButton, type ChipButtonProps } from "./Chip"
export { Input, Kbd, Select, Switch, Textarea, type SwitchProps } from "./Field"
export { Icon, type IconName, type IconProps } from "./Icon"
export { Bar, GenderIcon, GenderIconFor, ItemDot, Skeleton, hpTone, statTone } from "./Meters"
export { Drawer, Modal, Overlay, type ModalProps, type OverlayProps } from "./Modal"
export { Panel } from "./Panel"
export { Sprite, type SpriteProps } from "./Sprite"
export { ToastHost, toast } from "./Toast"
export { TypeBadge, type TypeBadgeProps } from "./TypeBadge"
