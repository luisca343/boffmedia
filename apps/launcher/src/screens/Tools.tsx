import { Suspense, useMemo, type CSSProperties } from "react"
import { Icon, isIconName, Spinner, type IconName } from "@boffmedia/ui"
import { getTool, listTools, type ToolManifest } from "@boffmedia/tool-kit"

import { useT } from "../i18n"
import { SectionHeader } from "../components/SectionHeader"
import { useLauncher } from "../state/launcher"

// D6 — this screen has NO per-tool wiring. It renders whatever the domain
// packages registered, so porting tool #2..N is a manifest entry plus a catalog
// merge, with nothing to change here.

/** Capabilities this host actually provides. A tool declaring something absent
 *  is hidden rather than offered and then failing at click time. `api` is listed
 *  because `tool-host.ts` routes it through the authenticated Rust proxy
 *  (`tool_api.rs`), which is what the MH Wilds tools need to load their data. */
const HOST_CAPABILITIES = new Set(["saveFile", "openUrl", "storage", "api"])

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

function ToolCard({ tool }: { tool: ToolManifest }) {
  const t = useT()
  const { go } = useLauncher()

  return (
    <button
      onClick={() => go("tool", undefined, { toolId: tool.id })}
      className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-4 text-left transition-colors hover:border-accent hover:bg-surface-bright"
    >
      <span className="mt-0.5 text-txt-muted transition-colors group-hover:text-accent">
        <Icon name={iconOf(tool)} size={22} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-medium text-txt">{t(tool.titleKey)}</span>
        <span className="block truncate text-sm text-txt-muted">{t(tool.descriptionKey)}</span>
      </span>
    </button>
  )
}

export function Tools() {
  const t = useT("tools")
  // The registry is populated by the import-time side effect in `tool-host.ts`'s
  // sibling registration (see main.tsx) — reading it in a memo keeps the sort
  // out of every render.
  const tools = useMemo(() => listTools().filter(supported), [])

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-xl font-semibold text-txt">{t("title")}</h1>
      <p className="mt-1 text-sm text-txt-muted">{t("subtitle")}</p>

      {tools.length === 0 ? (
        <p className="mt-6 text-sm text-txt-muted">{t("empty")}</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
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
  const { selectedToolId, go } = useLauncher()
  const tool = selectedToolId ? getTool(selectedToolId) : undefined

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
      <SectionHeader
        bordered
        label={t("back")}
        onBack={() => go("tools")}
        title={tRoot(tool.titleKey)}
      />
      {/* The manifest's `layout` decides this, and it is not cosmetic.
          `viewport` tools (the schematic pair) fill a bounded box and scroll
          their own panes, so an auto-scrolling parent would let them size to
          content and produce a second, outer scrollbar. `document` tools grow
          with their content and need US to scroll them — this container used to
          be unconditionally `overflow-hidden`, which clipped them dead: the MH
          Wilds tools could not scroll at all.

          `--tool-vh` / `--tool-sticky-top` are this host's half of the deal (see
          MhBar). The scrollport starts below the 40px titlebar and the 37px
          bordered SectionHeader, and nothing overlays its top edge — so the
          sticky offset is 0, which is NOT the same number as the chrome height.
          One variable could not serve both. */}
      <div
        style={
          {
            "--tool-vh": "calc(100dvh - 40px - 37px)",
            "--tool-sticky-top": "0px",
          } as CSSProperties
        }
        className={`min-h-0 flex-1 ${
          (tool.layout ?? "document") === "viewport" ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <Component />
        </Suspense>
      </div>
    </div>
  )
}
