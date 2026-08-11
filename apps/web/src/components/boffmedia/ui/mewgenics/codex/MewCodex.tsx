"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Banner } from "@boffmedia/ui"
import { MEW_SENAL_VARS } from "../mew-util"
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
  const t = useTranslations("mewgenics")
  const codex = useMewCodex()
  const { ready, error, selRec } = codex

  if (error) {
    return (
      <div className="p-10" style={MEW_SENAL_VARS}>
        <Banner tone="error" title={t("error.title")}>
          {t("error.checkPath", { path: "/data/mewgenics/", error: String(error.message || error) })}
        </Banner>
      </div>
    )
  }

  return (
    <div
      className="relative flex min-h-[calc(100dvh_-_var(--nav-h))] min-w-0 flex-col text-[color:var(--mwp-cream)] [font-family:var(--mwf-hand)]"
      style={{ ...MEW_SENAL_VARS, background: "radial-gradient(120% 90% at 50% -10%, #161a22 0%, var(--base-deep,#0b0d11) 55%, #050709 100%)" }}
    >
      {/* The strips are transparent, so the sticky group carries the backing.
          Under the site Navbar (z-50), over the page content. */}
      <div className="sticky top-[var(--nav-h)] z-[40] flex-none bg-[color:var(--mwp-night-2)]">
        <MewTopBar codex={codex} />
        <MewCatTabs codex={codex} />
      </div>

      {!ready ? (
        <div className="flex flex-1 items-center justify-center gap-3 py-24 text-[15px]/none font-semibold text-[color:var(--mwp-cream-dim)]">
          <span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%_45%_52%_48%] motion-reduce:animate-none" />
          {t("loading")}
        </div>
      ) : selRec ? (
        <MewFiche codex={codex} />
      ) : (
        <MewBrowse codex={codex} />
      )}
    </div>
  )
}
