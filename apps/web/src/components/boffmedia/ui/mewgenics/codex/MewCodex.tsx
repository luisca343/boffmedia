"use client"

import { useTranslations } from "next-intl"
import { Banner, Empty } from "@/components/boffmedia/primitives"
import { MEW_SENAL_VARS } from "../mew-util"
import { MewCatTabs, MewTopBar, MewTrail } from "./MewChrome"
import { MewRoster } from "./MewRoster"
import { useMewCodex } from "./useMewCodex"
import { MEW_DETAIL } from "./views"

// v3 «Señal» — Mewgenics · Codex «Papel y tinta». Orchestrator: owns the desk
// chrome + skin vars and composes the chrome strips, roster rail and detail fiche
// over the codex model. All state/logic lives in useMewCodex; each strip/rail/view
// is a focused presenter.
export function MewCodex() {
  const t = useTranslations("mewgenics")
  const codex = useMewCodex()
  const { ready, error, catDef, selRec, cat, rosterOpen, onNav, setRosterOpen, detailRef } = codex

  if (error) {
    return (
      <div className="p-10" style={MEW_SENAL_VARS}>
        <Banner tone="error" title={t("error.title")}>
          {t("error.checkPath", { path: "/data/mewgenics/", error: String(error.message || error) })}
        </Banner>
      </div>
    )
  }

  const Detail = selRec ? MEW_DETAIL[cat] : null

  return (
    <div
      className="relative flex h-[calc(100dvh_-_var(--nav-h,66px))] min-w-0 flex-col text-[color:var(--mwp-cream)] [font-family:var(--mwf-hand)]"
      style={{ ...MEW_SENAL_VARS, background: "radial-gradient(120% 90% at 50% -10%, #161a22 0%, var(--base-deep,#0b0d11) 55%, #050709 100%)" }}
    >
      <MewTopBar codex={codex} />
      <MewCatTabs codex={codex} />
      <MewTrail codex={codex} />

      {!ready ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-[15px]/none font-semibold text-[color:var(--mwp-cream-dim)]">
          <span className="h-[22px] w-[22px] animate-spin border-[3px] border-solid border-[color:var(--mwp-nline)] border-t-[color:var(--mwp-red)] [border-radius:50%_45%_52%_48%] motion-reduce:animate-none" />
          {t("loading")}
        </div>
      ) : (
        <div className="relative z-[1] grid min-h-0 flex-1 overflow-hidden [grid-template-columns:minmax(340px,400px)_minmax(0,1fr)] min-[1600px]:[grid-template-columns:minmax(380px,460px)_minmax(0,1fr)] max-[760px]:grid-cols-1">
          <MewRoster codex={codex} />
          {rosterOpen && <div className="fixed inset-0 z-[55] hidden bg-[rgba(10,6,16,0.6)] max-[760px]:block" onClick={() => setRosterOpen(false)} />}
          <main ref={detailRef} className="min-w-0 overflow-y-auto scroll-smooth [scrollbar-width:thin]">
            {Detail && selRec ? <Detail key={cat + selRec.id} rec={selRec} onNav={onNav} /> : <div className="p-10"><Empty icon={catDef.icon} title={t("roster.emptyPick", { category: catDef.singular })} lead={catDef.desc} /></div>}
          </main>
        </div>
      )}
    </div>
  )
}
