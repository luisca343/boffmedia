# Tier lists

The reusable web feature lives in `apps/web/src/features/tier-list/`. It is used by the catalog,
standalone board and template editor at `/tier-lists`, `/tier-lists/[slug]` and
`/tier-lists/[slug]/edit`, and can be embedded without those routes. It uses the Boffmedia v3
design system. The feature slice is intentional: the board and editor serve multiple routes;
it is not a new global primitive or a desktop tool package.

## Repository findings and scope

- Next.js 16.0.7 App Router, React 19.2.3, strict TypeScript; server routes pass template metadata
  into small client boundaries. The web currently uses Zod 4.4.3 (the older stack note is stale).
- NextAuth credentials/OAuth obtains Nest JWTs on `session.user.accessToken`. Existing account
  guards, cookies and session expiry behavior are unchanged.
- NestJS 11, MySQL and Drizzle repositories; API calls use `services/api/boffmedia` and the
  existing HTTP envelope helpers. No new account endpoints or database migrations are added.
- Existing state includes Zustand, but this isolated controlled board uses a pure reducer and
  bounded React history so embedding two boards does not share state accidentally.
- Existing `@dnd-kit/core`, `sortable` and `utilities` provide mouse, delayed touch and keyboard
  sensors. Drag translation lives under `dnd/`; the core does not import DnD or React.
- Whole-card activation and a cursor-centered, lifted preview follow SmartRotom's app-grid
  interaction pattern, using Boffmedia tokens. Shared `DragCard`, `DragPreview`, `DragTarget`
  `MediaCardContent` and `ColorInput` live in `@boffmedia/ui`; the DnD adapter owns sensors and placement rules.
  Active rows remain highlighted over nested insertion targets. Tap/Enter opens assignments;
  Space drags by keyboard and a short hold activates touch dragging.
- Existing `ArtImage` handles arbitrary hosts, missing images and errors. `@boffmedia/ui`
  supplies forms, modals, confirmations, focus trapping and v3 tokens; `next-intl` owns es/en UI.
- The existing authenticated `/upload/image` endpoint validates actual image content, dimensions
  and a 5 MB limit, and records ownership. The service adapter reuses it in `uploads/tier-lists`.
  Supported types are JPEG, PNG, WebP and GIF. These image URLs are public, independently of list
  visibility. Anonymous creation supports image URLs; anonymous binary uploads are not introduced.
  Image bytes, data URLs and temporary blob URLs never enter list JSON or localStorage.
- Browser KV/localStorage and bulk IndexedDB storage already exist in the tool host. Small list
  documents use separately versioned localStorage keys rather than coupling to a tool outbox.
  The teambuilder has a specific local-first sync policy; the owner reserved the tier-list sync
  policy for a later discussion, so that policy is not copied implicitly.
- Vitest covers core, serialization, persistence, drag translation, embedded interactions and
  autosave errors/order. Playwright covers real routes, desktop dragging, mobile tap assignment,
  reload, template editing, import/export and private local URL behavior.

## Definitions and state

`TierListTemplate` defines stable identity, slug, title, generic rows, source, settings, optional
system/user ownership, visibility preference and `sourceTemplateId` for remixes.
`TierListInstance` is one arrangement, with its own ID and visibility, placements and an optional
complete row override. Editing rows on a board does not mutate its template. Several instances can
use the same definition. Local saves carry a definition snapshot so custom definitions survive
reload and can travel with the arrangement.

Instances optionally own `title` and `description`. `editHeading` validates these fields through
the core and participates in history/autosave/JSON, without changing a template or sibling list.
`getTierListTitle` falls back to the template title. `getTierListDescription` uses a list caption
or a user template's description; system starter instructions stay in the catalog. A blank caption
explicitly removes inherited text. Import/export preserves that choice even when a starter becomes
a private user remix. Old version-1 documents without these optional fields remain readable.
Clearing/resetting placements preserves the list's heading.

An item has an ID, name, optional image URL/description/metadata and optional `{ source, id }`
entity reference. A placement is `{ id, itemId }`: its occurrence ID distinguishes explicitly
allowed copies of the same item. Rows are ordered arrays of these occurrences.

`exclusive` assigns an item to one row and removes it from other rows. `multi` copies across rows.
Both normally prohibit duplicate item IDs within a row. `allowDuplicateWithinRow` allows separate
occurrences within that one row; exclusive mode still permits only one destination row.
`keepSourceVisible` sets the default source view: true starts with the full collection, false
starts with items absent from every row. Explicit All/Assigned filters can recover ranked cards.
Dropping a multi occurrence into the pool removes just that occurrence;
an exclusive pool drop unassigns that item. The tap menu also offers removal from every row.

Permissions independently control row creation/deletion/editing/reordering and item reordering.
The core enforces them, including when an action is dispatched without the UI. Empty rows, row
clearing, reset, counts, source filtering and a 50-commit undo/redo history are generic.

## A small template and an embedded board

```tsx
"use client"
import { useState } from "react"
import {
  TierList, createDocument, tierListSettingsSchema,
  type TierListTemplate,
} from "@/features/tier-list"

// Titles and item names here are consumer data. Translate system-authored labels
// using your host's next-intl translator; user-authored content stays as entered.
const template: TierListTemplate = {
  id: "priorities", slug: "priorities", title: "Priorities",
  rows: [{ id: "high", label: "High", color: "#f08080" }, { id: "low", label: "Low" }],
  source: { type: "static", items: [{ id: "task-1", name: "Task 1" }] },
  settings: tierListSettingsSchema.parse({ placementMode: "multi", keepSourceVisible: true }),
  ownership: { type: "system" }, visibility: "public",
}

export function EmbeddedPriorities() {
  const [doc, setDoc] = useState(() => createDocument(template, template.source.type === "reference" ? [] : template.source.items))
  return <TierList template={doc.template} instance={doc.instance} items={doc.items}
    onChange={(instance) => setDoc((previous) => ({ ...previous, instance }))} />
}
```

No storage is required for the controlled board. To add persistence/history, construct a document
and call `useTierList(document, adapter)` once per stable template/instance pair. Dispatch the
action returned by the board's second `onChange` argument to the hook. Key a consuming component
by the template and instance IDs when switching documents.

For a developer-created standalone template, add a translated definition to `templates.ts`.
The system catalog and slug route use that registry. UUID slugs belong to local user-created
definitions; unknown system slugs return 404. `/tier-lists/new/edit` creates a private local
definition. Editing a system template remixes it with a fresh UUID, keeping its original intact.

`/tier-lists/fire-emblem-fortunes-weave` is a concrete multi-route collection with
50 characters. Its four groups are Cai, Dietrich, Theodora and Leda;
each lord starts in their own route, cards can appear in several routes, and the full source
pool stays available. Only pre-timeskip lord artwork is used, with fresh asset URLs for caches.
Saved boards and private remixes receive corrections to the exact former site-owned lord
image URLs for display/export, without replacing placements or custom artwork.
It reuses
the same workspace, editor, display switches, persistence and export components. Shared
identities and asset URLs live in `features/fortunes-weave/characters.ts`. The collection has
no dependency on a dedicated recruitment page. Artwork lives in root
`public/boffmedia/img/games/fortunes-weave/portraits/`, using the existing public asset structure
rather than source imports or copies inside tier-list internals. All public assets remain ignored.
See `features/fortunes-weave/README.md`
for Polygon provenance and `/styles/components` → Tier Lists for the reuse example.

Templates optionally define `initialPlacements: Record<rowId, itemId[]>`. This is a generic
starting arrangement, validated against rows, source items, mode, duplicate rules and limits.
Each new instance gets independent occurrence IDs. Clear empties placements; Reset restores
the template's rows and starting assignments. Defaults travel with JSON and private remixes,
independently of current placements. Existing version-1 templates without them stay compatible.

The catalog's **Edit preset** action opens the same `TierListTemplateEditor` at
`/tier-lists/[slug]/edit`. System edits save a private reusable copy, retaining the base preset.
Catalog editing uses the current base definition, even when the device has an older saved
list; instance-specific edit links retain the existing remix/reconciliation behavior.
`TierListStartingPlacementsEditor` composes the actual controlled board inside that editor:
drag or tap to change defaults, with no second assignment implementation. Deleting rows/items
prunes affected defaults; changing collection clears them; switching to exclusive mode reconciles
cross-row copies. Changes to a preset do not silently replace saved instance placements. If a
system preset changes, its workspace offers a fresh list using the new definition while keeping
the saved arrangement. This editor is also demonstrated under `/styles/components` → Tier Lists.

## Sources and composition

Static/custom sources contain small item collections. Reference sources are `{ type: "reference",
key, params? }`. `resolveTierListItems` uses an injected resolver registry, never a supplied endpoint
URL. Put HTTP integration under `services/`, import existing generated DTOs from
`@boffmedia/shared` there, and adapt them into generic items. Do not duplicate the underlying dataset.
`tierListSourcesService.ts` demonstrates this using `EventsService.getGames()` and stable `game-*`
IDs/entity references. Saved documents keep the resolved collection snapshot so existing boards
can be reopened without re-fetching the source; new reference boards require their initial load.

```ts
const resolvers = {
  collection: async () => existingRecords.map((record) => ({
    id: `entry-${record.id}`, name: record.displayName, image: record.art,
    metadata: { category: record.category }, entity: { source: "collection", id: String(record.id) },
  })),
}
const items = await resolveTierListItems({ type: "reference", key: "collection" }, resolvers)
```

`renderItem(context)` replaces the visual *inside* the tile's assignment button. Return display
content, not another interactive control. The context includes item, row ID, occurrence ID and
position. Use `itemActions(context)` for contextual buttons inside the assignment dialog.
`renderRowHeader(row, count)`, `sourceControls`, `filterItem(item)` and `summary(document)` supply
badges, headers, filters and feature-specific summaries without changing the core model.

```tsx
<TierList {...boardProps}
  renderItem={({ item }) => <span>{item.name} · {String(item.metadata?.category ?? "")}</span>}
  filterItem={(item) => !activeCategory || item.metadata?.category === activeCategory}
  summary={(doc) => <MySummary instance={doc.instance} />}
/>
```

The source defaults to Unassigned when `keepSourceVisible` is false, and All when it is true.
Explicit All/Assigned/Unassigned filters operate on the full resolved collection, combined with
case-insensitive search and the consumer's `filterItem`. Ranked cards remain recoverable from
All/Assigned; filtering never changes row placements. Assignment dialogs, reorder buttons,
whole-card drag activators, visible focus and localized screen-reader announcements are available on every board.

The entire card, including artwork and name, is the drag activator. No grip marker is rendered.
An activated drag suppresses the assignment click, preserves a faded origin, and shows the
lifted preview plus row/insertion feedback. `tierListMovementPreview` derives a temporary
instance through the core rules. `DragPlaceholder` occupies the exact destination and
surrounding cards reflow before release. The active drag node stays mounted while its
projected origin disappears; placeholders are measured drop targets to keep hover stable.
Cancellation/outside drops discard the projection. Only a valid drop calls `onChange`
once, producing one undo entry and save. Invalid duplicates and disabled reordering get
no misleading preview. Sensor movement drives projection; layout-only hover changes
cannot recursively reorder it. Cards, gaps and rows use live bounds during batched measurements;
hidden origins cannot intercept projected neighbors. Padding next to a caption resolves to its
card, avoiding a premature move to the row's end during activation.
Keyboard navigation uses card centers to account for the tilted overlay, reaches empty
rows, and restores focus to the resulting card. The compact right-side row toolbar
shows only gear/up/down, using shared `IconButton` and `Menu iconOnly`. Edit/clear/delete remain
available inside the gear, with the existing permissions and confirmations.

The two activity demos use illustrative artwork already under `/boffmedia/img` in public.
Older system snapshots receive missing demo images through `withTierListStarterImages`
for display/export; it preserves saved state, user images and user definitions. Custom
templates retain their supplied public/upload/remote image references and name fallbacks.

## Component reuse and live documentation

Reuse `@boffmedia/ui` before adding feature markup. Extract generic controls and presentation
there while keeping template/state/persistence behavior in this feature. Add showcase examples
in the same change: `/styles/components` → Primitivas contains `ColorInput`; Tier Lists contains
the drag primitives, independent exclusive/multi embedded boards and the template editor.
These demos use the shipped components and in-memory state, without storage/API writes.
See `packages/ui/README.md` for the shared controls' contracts.

## Persistence, account integration and privacy

`TierListPersistenceAdapter` loads/saves/deletes a **whole document** so templates, instance row
overrides and custom items survive together. `LocalStorageTierListAdapter` uses
`tier-list:v1:<template-id>:<instance-id>` per document. Reads validate the schema and key identity.
Corruption, blocked storage and quota errors surface without destroying current in-memory state.
Autosaves run only after reducer commits, in order. Explicit retry re-saves the current state.
A failed load cannot trigger an empty save. Discarding corrupt data requires confirmation.

`AccountTierListAdapter` validates an injected driver with the same interface. It intentionally has
no invented HTTP routes. An actual driver must live in `services/api/boffmedia`, use generated DTOs
and existing authed helpers, and propagate failures. Its server must derive the owner from
`CurrentUser`, validate payloads and enforce access to templates, instances, remixes and visibility
server-side. Never trust imported `ownerId`, visibility or a client-supplied account ID as permission.

Before connecting that driver, decide explicit upload/adoption behavior for anonymous lists,
separate account/local catalog behavior, conflict/version checks, retry/debounce policy, deletion
and logout behavior. Two compatible choices are explicit account adoption/upload or a local-first
outbox with user-approved sync triggers; this implementation commits to neither. Stable IDs,
portable documents and the adapter boundary support either. No automatic upload occurs at login.

Public/unlisted/private currently represent **future sharing preference**, not publication.
There is no public user document lookup or share URL endpoint. A local UUID URL only reads that
browser's storage; other browsers see a missing-local-list message. Server metadata for such URLs
is generic and noindex. Only system templates are server-rendered publicly. Uploaded image URLs
remain public under the existing upload infrastructure; private image delivery needs a separate
backend access decision before claiming private assets.

## Files and limits

JSON uses `{ schemaVersion: 1, template, instance, items }`. `parseTierListDocument` validates
structure, unique IDs, source/snapshot agreement, row/item references, occurrence IDs, settings,
exclusive and duplicate rules, URL schemes, depth and size. Unsupported versions fail explicitly;
future migrations should run before the version-specific parse. Limits: 64 rows, 2,000 items,
10,000 placements, 5 MB JSON, 12 object levels. Importing creates a fresh private local copy.

Export whitelists schema fields, strips account IDs/timestamps and opaque metadata/entity fields,
and materializes reference collections as static items for portability. Names, descriptions and
image URLs intentionally travel with the export. This is a portable board snapshot, not an export
of custom feature metadata. External image URLs still need their host to remain available.

PNG captures the live `[data-tier-presentation]` region at 2× resolution and its current responsive
width. `presentationRef` gives a host access to that region; `heading` supplies its title content.
The lazy exporter delegates to the reusable `lib/export/domToPng` utility: computed styles,
pseudo elements, self-hosted fonts and image assets are embedded in an SVG foreignObject and
rendered by the browser. It preserves typography, image cropping, row colors and card geometry,
including custom inline DOM item renderers. No second board layout or dependency is introduced.

`TierListDisplayControls` reuses library `Toggle` controls. Pass its controlled value to `TierList`
as `display` and use `title`/`descriptions` when composing the heading. Title, item labels, row
labels, counts, descriptions and editing controls affect both page and PNG. Hiding editing controls
also hides empty-row instructions; cards remain draggable and accessible by name.
Preferences are view state, independent of placement/history/JSON and of exclusive/multi mode.
Row counts default off and use compact centered numeric `Badge` controls when enabled.
`TierListRowHeader` gives labels readable body typography, natural case, consistent centering
and wrapping for long names. Cards use the shared `--drag-card-size` at `6rem`; preview and slot
inherit the same size. `MediaCardContent` supplies the square media slot and a compact,
centered 28px caption with up to two lines, reused by cards, overlays, insertion slots,
editor thumbnails and the live `/styles/components` examples. Custom renderers own their label visibility.
`TierListHeading` and `TierListHeadingEditor` are reused by the workspace and component showcase;
the editor composes library `Modal`, `Field`, `Input`, `Textarea` and `Button`. Headings sit in
the presentation panel with consistent padding; row names/colors remain editable through gear.
Both modes and the display controls are demonstrated in `/styles/components` → Tier Lists.

Assets must be accessible from the browser (same-origin public/uploads or CORS-enabled external
URLs). A visible image that blocks downloading causes a specific export error, rather than a
silently different PNG. Already broken images retain the same visible name fallback. Animated
assets are captured as a static frame. Regions over 64 million output pixels or 32,767 pixels on
one axis reject cleanly. The source pool, toolbars, mode hints and dialogs are outside the captured
region. Real-browser pixel comparisons cover desktop/mobile layouts and presentation switches.

Image storage is behind `TierListImageStorageAdapter`. The initial editor offers the existing
authenticated server uploader, URL entry and name-only items. A future anonymous binary-image
adapter can store blobs in IndexedDB and add a separate asset bundle format; do not put base64
blobs in the ordinary JSON/localStorage schema or advertise transient object URLs as portable.

## Checks

```powershell
pnpm --filter web test:unit src/features/tier-list
pnpm --filter web exec playwright test tests/specs/boffmedia/tier-lists.spec.ts --project=chromium
pnpm check:i18n
pnpm type-check
pnpm lint
```

Playwright targets the local app by default. The feature tests do not authenticate or write to the
backend; the site-games source is mocked with existing API-shaped data. Backend sync, a community
marketplace and real public/unlisted user sharing remain future work.
