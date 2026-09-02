"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "../i18n"
import { Banner, ToolStrip } from "@boffmedia/ui"
import { mewTextureSrc, mewCursor } from "../mew-art"
import { MewCatTabs, MewTopBar } from "./MewChrome"
import { MewBrowse } from "./MewBrowse"
import { MewFiche } from "./MewFiche"
import { useMewCodex } from "./useMewCodex"

// v3 «Señal» — Mewgenics · Codex «Papel y tinta». Orchestrator: owns the desk
// chrome + skin vars and switches between the two screens.
//
// Browse ⇄ detail, not a rail beside a pane: the grid gets the full page width
// and a fiche replaces it, so the page has exactly one scroll region. Only the
// brand bar and the category tabs are sticky; everything else rides the page.
export function MewCodex() {
  const t = useToolT(MEWGENICS_NS)
  const codex = useMewCodex()
  const { ready, error, selRec, cursorEnabled, codexRef } = codex
  const [chromeH, setChromeH] = React.useState(0)
  const chromeRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!chromeRef.current) return
    const observer = new ResizeObserver(() => {
      setChromeH(chromeRef.current?.offsetHeight ?? 0)
    })
    observer.observe(chromeRef.current)
    return () => observer.disconnect()
  }, [])

  // Above the error branch, not below it. These two are hooks, and an early
  // return that skips them renders FEWER hooks than the previous pass — React
  // answers that by throwing, so the moment the dataset failed to load the tool
  // crashed instead of showing the banner three lines down. Harder to hit on
  // the web, where the assets sit on the same origin as the page; the launcher
  // fetches them over a connection that is allowed to be missing, which makes
  // this the failure path it takes most often.
  const grainUrl = React.useMemo(() => mewTextureSrc("largegrain"), [])
  const defaultCursorData = React.useMemo(() => (cursorEnabled ? mewCursor("default") : null), [cursorEnabled])

  if (error) {
    return (
      <div className="mew-skin p-10">
        <Banner tone="error" title={t("error.title")}>
          {t("error.checkPath", { path: "/boffmedia/tools/mewgenics/", error: String(error.message || error) })}
        </Banner>
      </div>
    )
  }

  return (
    <div
      ref={codexRef}
      // -1: focusable by script (see `pick()`), never by Tab. A fiche opened
      // without a click (deep link, keyboard paging) left focus on <body>,
      // outside this container, so the Escape handler below — bound on the
      // container so it stays scoped to the codex — never saw the keydown
      // until the player clicked something first.
      tabIndex={-1}
      className="mew-skin relative flex min-h-[var(--tool-vh)] min-w-0 flex-col text-[color:var(--mwp-cream)] [font-family:var(--mwf-hand)] focus:outline-none"
      style={{
        background: "radial-gradient(120% 90% at 50% -10%, var(--mwp-bg-glow) 0%, var(--base-deep,#0b0d11) 55%, var(--mwp-bg-deep) 100%)",
        "--mew-chrome-h": `${chromeH}px`,
        ...(grainUrl ? { "--mwp-grain": `url(${grainUrl})` } : {}),
        ...(defaultCursorData ? { cursor: `url(${defaultCursorData.src}) ${defaultCursorData.hotspot[0]} ${defaultCursorData.hotspot[1]}, auto` } : {}),
      } as React.CSSProperties}
    >
      {/* System geometry, own skin. Same object as every other tool bar — one
          height, one gutter, one sticky context, title row + tab row — with the
          Mewgenics palette supplied through the strip's three colour tokens.
          What makes this feel like Mewgenics is the ink and the paper, not a
          bespoke 64px row. Shadow applied via token instead of border geometry. */}
      <div
        ref={chromeRef}
        style={{
          "--tool-bar-bg": "var(--mwp-night-2)",
          "--tool-bar-sub-bg": "var(--mwp-night-2)",
          "--tool-bar-line": "var(--mwp-nline)",
        } as React.CSSProperties}
      >
        <ToolStrip
          style={{
            boxShadow: "0 2px 0 var(--mwp-nline)",
          }}
          sub={<MewCatTabs codex={codex} />}
        >
          <MewTopBar codex={codex} />
        </ToolStrip>
      </div>

      {!ready ? (
        <div className="flex flex-1 items-center justify-center gap-3 py-24 text-[15px]/none font-semibold text-[color:var(--mwp-cream-dim)]">
          <span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%_45%_52%_48%] motion-reduce:animate-none" />
          {t("loading")}
        </div>
      ) : (
        <div role="tabpanel" id={`mew-panel-${codex.cat}`} aria-labelledby={`mew-tab-${codex.cat}`}>
          {selRec ? <MewFiche codex={codex} /> : <MewBrowse codex={codex} />}
        </div>
      )}
    </div>
  )
}
