import { Suspense, useMemo, useState, type CSSProperties } from "react"
import {
  Banner,
  Empty,
  hueColorOf,
  isIconName,
  SearchInput,
  SectionBar,
  SECTION_BAR_H,
  Spinner,
  ToolGrid,
  ToolGroupHead,
  ToolHeader,
  type IconName,
  type ToolCardData,
} from "@boffmedia/ui"
import {
  getTool,
  getToolHost,
  listTools,
  useToolOnline,
  useToolSession,
  type ToolDomain,
  type ToolManifest,
} from "@boffmedia/tool-kit"

import { useT } from "../i18n"
import { TOOL_DOMAIN_META, TOOL_DOMAIN_ORDER } from "../data/toolDomains"
import { useApp } from "../state/app"
import { useToolPack } from "../components/useToolPack"
import { isDesktop } from "../runtime"

// This screen has NO per-tool wiring. It renders whatever the domain packages
// registered, so adding a tool is a manifest entry plus a catalog merge, with
// nothing to change here.

/** Capabilities this host actually provides. A tool declaring something absent
 *  is hidden rather than offered and then failing at click time. `api` is listed
 *  because `tool-host.ts` routes it through the authenticated Rust proxy
 *  (`tool_api.rs`), which is what the MH Wilds tools need to load their data.
 *  `data`, `network` and `assetUrl` are implemented too (see `tool-host.ts`) —
 *  their absence here was a latent bug: any manifest declaring one of them was
 *  silently hidden from the launcher's own listing. */
/** DERIVED from the configured host rather than hand-listed, because the
 *  hand-list was wrong twice: `data`, `network` and `assetUrl` were implemented
 *  and missing from it, and every manifest declaring one was silently dropped
 *  from this listing. A capability exists exactly when `tool-host.ts` put it on
 *  the host object, so ask the object. `tool-host.ts` runs its
 *  `configureToolHost` at import time (see main.tsx), long before this renders. */
const HOST_CAPABILITIES = new Set<string>(Object.keys(getToolHost()))

function supported(tool: ToolManifest): boolean {
  return (tool.requiredCapabilities ?? []).every((c) => HOST_CAPABILITIES.has(c))
}

/** A manifest's `icon` is a plain string on purpose — the registry is
 *  host-agnostic and cannot know this host's icon set. Map it here, falling
 *  back rather than rendering nothing when a package names a glyph the
 *  launcher's `@boffmedia/ui` version does not have yet. */
const ICON_FALLBACK: IconName = "wrench"
function iconOf(tool: ToolManifest): IconName {
  return isIconName(tool.icon) ? tool.icon : ICON_FALLBACK
}

export function Tools() {
  const t = useT("tools")
  const tRoot = useT()
  const { go } = useApp()
  const [query, setQuery] = useState("")

  // Listing only — the API refuses an unauthorised call whether or not the tile
  // was drawn. What this buys is a grid that does not advertise a door this
  // account cannot open. An offline restore carries no roles, so a role-gated
  // tool stays hidden until a live session says otherwise.
  const roles = useToolSession().user?.roles

  // The registry is populated by the import-time side effect in `tool-host.ts`'s
  // sibling registration (see main.tsx) — reading it in a memo keeps the sort
  // out of every render.
  const tools = useMemo(() => listTools({ roles }).filter(supported), [roles])

  // The manifest carries message KEYS; the cards want display text. Resolving
  // once here is also what makes the search work on what the player can see
  // rather than on key names.
  const cards = useMemo(() => {
    const byDomain = new Map<ToolDomain, ToolCardData[]>()
    for (const tool of tools) {
      const meta = TOOL_DOMAIN_META[tool.domain]
      const card: ToolCardData = {
        key: tool.id,
        title: tRoot(tool.titleKey),
        desc: tRoot(tool.descriptionKey),
        cat: tool.categoryKey ? tRoot(tool.categoryKey) : undefined,
        icon: iconOf(tool),
        isNew: tool.isNew,
        hueColor: hueColorOf(meta.hue),
      }
      const bucket = byDomain.get(tool.domain)
      if (bucket) bucket.push(card)
      else byDomain.set(tool.domain, [card])
    }
    return byDomain
  }, [tools, tRoot])

  const labels = useMemo(() => ({ isNew: t("badgeNew"), soon: t("badgeSoon") }), [t])

  const groups = useMemo(
    () =>
      TOOL_DOMAIN_ORDER.filter((d) => cards.has(d)).map((domain) => ({
        domain,
        meta: TOOL_DOMAIN_META[domain],
        tools: cards.get(domain) ?? [],
      })),
    [cards],
  )

  const term = query.trim().toLowerCase()
  const results = term
    ? [...cards.values()]
        .flat()
        .filter((c) => c.title.toLowerCase().includes(term) || c.desc.toLowerCase().includes(term))
    : null

  const open = (card: ToolCardData) => go("tool", undefined, { toolId: card.key })

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-8 py-7">
      <ToolHeader
        className="mb-6"
        title={t("title")}
        sub={t("subtitle")}
        actions={
          tools.length > 0 ? (
            <div className="w-[280px]">
              <SearchInput value={query} onChange={setQuery} placeholder={t("search")} size="sm" />
            </div>
          ) : undefined
        }
      />

      {tools.length === 0 ? (
        <p className="text-sm text-txt-muted">{t("empty")}</p>
      ) : results ? (
        results.length === 0 ? (
          <Empty icon="search" title={t("noResults")} lead={t("noResultsFor", { query: query.trim() })} />
        ) : (
          <ToolGrid tools={results} variant="senal" labels={labels} onSelect={open} />
        )
      ) : (
        // Grouped by game, the way the site's hub is: with six tools across two
        // games, the game IS the thing a player navigates by.
        <div className="flex flex-col gap-9">
          {groups.map((g) => (
            <section key={g.domain}>
              <ToolGroupHead
                name={tRoot(g.meta.nameKey)}
                tagline={tRoot(g.meta.taglineKey)}
                hueColor={hueColorOf(g.meta.hue)}
                logoLabel={g.meta.logoLabel}
                count={t("toolCount", { count: g.tools.length })}
              />
              <ToolGrid tools={g.tools} variant="senal" labels={labels} onSelect={open} />
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** One tool, full-screen. The manifest component is lazy, so three.js and the
 *  block registries only load once a tool is actually opened — the launcher's
 *  startup cost is unchanged by the Tools section existing. */
export function ToolView() {
  const t = useT("tools")
  const tRoot = useT()
  const { selectedToolId, go } = useApp()
  const online = useToolOnline()
  const tool = selectedToolId ? getTool(selectedToolId) : undefined

  // Only a desktop host with a manifest that opts in ever prefetches anything
  // — dev:renderer reaches the loose tree through the Vite proxy, and the web
  // host ignores `dataPack` entirely. The hook is purely a side effect: the
  // tool below mounts unconditionally, whatever the pack's state is (RF4,
  // seamless revision 2026-09-02 — no gate, no button, nothing shown here).
  const packId = isDesktop() ? tool?.dataPack?.id : undefined
  useToolPack(packId)

  if (!tool) {
    return (
      <div className="p-6">
        <p className="text-sm text-txt-muted">{t("notFound")}</p>
        <button
          onClick={() => go("tools")}
          className="mt-3 text-sm text-accent hover:underline"
        >
          {t("back")}
        </button>
      </div>
    )
  }

  const Component = tool.component

  return (
    <div className="flex h-full min-h-0 flex-col">
      <SectionBar
        bordered
        label={t("back")}
        onBack={() => go("tools")}
        title={tRoot(tool.titleKey)}
      />
      {/* Said HERE and only for tools that need the server, which is why it is
          not the shell's `OfflineNotice`: that one is about the pack library
          and is deliberately suppressed outside Play. A tool with no `api`
          capability (the schematic pair, PMD Sky) is unaffected by an outage
          and must not be told it is broken.

          Above the tool rather than instead of it: whatever the tool already
          has on screen still works, and replacing it with an error would throw
          away state the player can still use. */}
      {!online && (tool.requiredCapabilities ?? []).includes("api") && (
        <Banner tone="warn" icon="alert" title={t("offlineTitle")} className="m-4 mb-0">
          {t("offlineBody")}
        </Banner>
      )}
      {/* The manifest's `layout` decides this, and it is not cosmetic.
          `viewport` tools (the schematic pair) fill a bounded box and scroll
          their own panes, so an auto-scrolling parent would let them size to
          content and produce a second, outer scrollbar. `document` tools grow
          with their content and need US to scroll them — this container used to
          be unconditionally `overflow-hidden`, which clipped them dead: the MH
          Wilds tools could not scroll at all.

          `--tool-vh` / `--tool-sticky-top` are this host's half of the deal (see
          MhBar). The scrollport starts below the 40px titlebar and the bordered
          SectionBar, whose height is read from `SECTION_BAR_H` rather than
          respelled — a bar-height change that misses this silently drifts the
          scrollport. Nothing overlays its top edge, so the sticky offset is 0,
          which is NOT the same number as the chrome height: one variable could
          not serve both. */}
      <div
        style={
          {
            "--tool-vh": `calc(100dvh - 40px - ${SECTION_BAR_H})`,
            "--tool-sticky-top": "0px",
          } as CSSProperties
        }
        className={`min-h-0 flex-1 ${
          (tool.layout ?? "document") === "viewport" ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {/* Always mounted, whatever the tool's data pack state is — the pack
            is a silent background prefetch (`useToolPack`), never a reason to
            withhold the tool itself. `Suspense` is only for the lazy chunk. */}
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          }
        >
          {/* `gutter` tools bring no padding of their own — on the site they get
              it from `ToolShell`, which this host has no counterpart for. The
              clamp is the datakit's (`--dk-pad`), not the site's wider one, so a
              gutter-less tool lines up with the VGC and MH Wilds tools already
              in this window rather than with a full-width web page.

              INSIDE `Suspense` and around the component only: wrapping the
              scrollport instead would pad the offline banner and, for a
              `viewport` tool, shrink the box it is supposed to fill exactly. */}
          {tool.gutter ? (
            <div className="px-[clamp(14px,2vw,32px)] pb-10">
              <Component />
            </div>
          ) : (
            <Component />
          )}
        </Suspense>
      </div>
    </div>
  )
}
