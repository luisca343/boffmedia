# Boffmedia UI

`@boffmedia/ui` is the shared Boffmedia design system for web and desktop. Keep it host-agnostic:
no Next.js, next-intl, Tauri, application aliases or domain state. Hosts call `configureUi()`.

For every UI change, check this library first. Extract reusable controls/presentation here,
keep domain behavior in its feature, and add live specimens and usage notes to the web's
`/styles/components` showcase in the same change. SmartRotom retains its own design system.

## ColorInput

`ColorInput` fills the entire clickable field with its selected color, with a contrasting
hex value and palette icon over a native color input. It supports
controlled `value`/`onChange`, uncontrolled `defaultValue`, forwarded input refs, native form
attributes, `disabled` and compact `size="sm"`. `className` styles the chassis. ARIA properties
reach the native input, so `Field` can name it and attach hint/error descriptions.

```tsx
import { ColorInput, Field } from "@boffmedia/ui"

<Field label={translatedLabel}>
  <ColorInput value={color} onChange={(event) => setColor(event.target.value)} />
</Field>
```

Live states: `/styles/components` → Primitivas → ColorInput.

## Compact menu triggers

`Menu iconOnly icon="settings" size="sm" ariaLabel={translatedLabel}` uses `IconButton` as
one native trigger with the existing menu's focus, keyboard navigation and portal positioning.
Use `items` for secondary actions rather than showing a permanent row of buttons. The tier-list
showcase demonstrates gear/up/down controls, with edit, clear and delete inside the gear menu.

## DragCard, DragPreview, DragPlaceholder, DragTarget

These are presentation components, independent of any DnD library or tier-list rules:

- `DragCard` is a whole-card native button. Forward the host's drag ref, listeners and ARIA
  attributes to it; `onClick` can open an action menu. Its `dragging` state leaves a faded origin
  and `dropTarget` marks an insertion point. `showGrip={false}` hides the marker while preserving
  whole-card activation, useful for clean presentation views. Children contain display content only.
- `DragPreview` is the lifted, tilted, non-interactive overlay artwork. It respects reduced
  motion. The host positions it, owns its overlay lifecycle and chooses drop animation.
- `DragPlaceholder` is an in-flow, faded artwork slot with an accent dashed border. Insert it
  at the projected destination to shift neighboring cards before dropping. Forward its div
  ref to the host's drop registration so the new slot remains a stable hover target.
- `DragTarget` forwards a div ref and attributes. `dragging` shows available destinations;
  `active` highlights the hovered destination. The host should derive that state from both
  container and nested item targets.

`--drag-card-size` sizes the card, preview and placeholder together (default `5rem`). Set it on
the host region so movement preserves geometry. Tier lists use `6rem` for more readable names.

The tier-list DnD adapter demonstrates integration with existing dnd-kit mouse, touch and
keyboard sensors. Its mouse threshold distinguishes a click from a drag; a delayed touch
activation preserves tap assignment and scrolling. Space starts keyboard dragging; Enter
opens the assignment menu. The board projects movement through its placement rules without
calling `onChange`, saving or changing undo history. Only a valid drop commits the preview.
The row toolbar reuses `IconButton size="sm"` and `Menu iconOnly` with translated labels/tooltips
on the right.

Live states and functioning embedded boards: `/styles/components` → Tier Lists.
The feature's `TierListDisplayControls` composes the existing library `Toggle` to control labels,
counts, descriptions, title and editing decorations on the live board and matching PNG export.
These are presentation preferences; exclusive/multi behavior remains in the template.
The domain board/editor remain in `apps/web/src/features/tier-list`; see that feature's README
for templates, placement rules, persistence and renderer composition.
