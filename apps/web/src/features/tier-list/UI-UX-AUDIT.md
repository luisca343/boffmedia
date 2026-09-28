# Tier-list UI and UX audit — 2026-09-28

Scope: catalog entry points, saved workspaces, embedded boards, preset/template editing,
mouse/touch/keyboard placement, assignment dialogs, source filters, history, local saves,
JSON import/export, PNG appearance, English/Spanish, and the component showcase.

## Findings and changes

| Finding | Change |
| --- | --- |
| Cross-row assignment checked for duplicates anywhere in the document, preventing normal exclusive moves and multi-row copies. | Check only the destination row. Keep fixed-row restrictions independent. Added real Fire Emblem regression cases. |
| Lords looked draggable even though dropping them into another route could never succeed. | Lock marker and explanatory title; disable their drag sensor while retaining their details/assignment dialog. The engine still guards assignment, removal, clearing and row deletion. Lords can be reordered within their route using the dialog. |
| Multi-row behavior was easy to confuse with an exclusive move. | Keep the placement-mode explanation visible, show current assigned rows in the dialog, highlight selected destinations, and mark assigned source cards. The preset still allows ordinary characters in several routes. |
| Workspace controls and help competed with the board. | Group edit/file/reset actions, emphasize PNG export, collapse appearance settings and detailed help, and consolidate device-save status with navigation. |
| Empty source pools did not distinguish completion from unsuccessful filtering. | Add unique-item assignment progress, separate complete/no-match/empty states, and a Show all items recovery action. The empty drop area remains available for returning cards. |
| Dialogs offered unavailable removal actions and had no explicit completion action. | Disable removal when unassigned, add Done, and retain focus on the destination card after an exclusive assignment. Fall back to source search when filters hide all remaining occurrences. |
| Generic confirmations obscured the difference between Clear, Reset and deleting a row. | Separate descriptions state what changes, what happens to locked items, and that board changes support undo. Disable Clear when only locked items remain. |
| Hiding editing controls left Add row visible. | Apply the same preference to row creation. The starting-placement editor no longer exposes a row action whose result it cannot persist. |
| Fifty expanded character forms made the preset editor cumbersome. | Extract a compact item editor with artwork, an accessible disclosure, mounted native fields, and per-item validation expansion. New items start open. Prevent source-search Enter from submitting the surrounding template form. |
| Clearing a normal board retained redundant empty placement arrays and failed existing serialization expectations. | Remove empty row entries while retaining locked placements. |

## Reuse and showcase

- `@boffmedia/ui` `DragCard`: `dragDisabled` presentation and a non-interactive `status` slot.
  Hosts still own sensors; click actions remain available.
- `TierListSourcePanel`: controlled search/filter, progress, recovery states, optional controls,
  and host-supplied cards/drop area.
- `TierListInstructions`: mode explanation and expandable input/lock guidance.
- `TierListTemplateItemEditor`: controlled per-item fields, disclosure, remove and optional upload callbacks.
- `TierListDisplayControls`: optional collapsed presentation, retaining its controlled API.

All are documented through live examples at `/styles/components` → **Tier Lists**, including
locked/assigned cards, source recovery, independent exclusive/multi boards, a compact Fire Emblem
board, an item editor and the full template editor. Feature-specific components stay in the feature
slice; host-independent drag presentation stays in the shared UI package.

## Behavioral contract

Fire Emblem has four fixed Lords and 46 available characters. Ordinary characters may be assigned
to several routes; dragging across routes copies in this preset. Returning one occurrence to the
pool removes that occurrence. Duplicate characters within a route remain disallowed. Clear keeps
the Lords; Reset restores the template defaults. Exclusive presets move rather than copy.

Existing valid legacy boards retain their ordinary placements while the preset migration restores
Lords to their own routes. Appearance changes do not alter saved placements. PNG export captures
the live presentation, including current responsive geometry and display preferences.

## Verification

See the feature's Vitest suites and `tests/specs/boffmedia/tier-lists.spec.ts`. Coverage includes real
mouse dragging, delayed touch dragging, Space/arrow keyboard placement, Enter/click assignment,
Lord restrictions, multi-route copying, source recovery, undo/redo, reload, legacy migration,
template editing, independent lists, JSON round trips and PNG comparisons at desktop/mobile sizes.
Browser checks use localhost and isolated test storage. Screenshot review covers desktop, mobile,
the Fire Emblem board and the component showcase. This is local validation, not deployment.

Results: 67 unit tests passed; all 14 browser scenarios passed across the suite and targeted
reruns (including the corrected legacy fixture and collapsed-field validation). `pnpm type-check`
passed for every workspace package. The full `pnpm lint` chain completed successfully, with four
existing web warnings outside this feature. Translation parity, design-system/icon guards and
`git diff --check` passed.
