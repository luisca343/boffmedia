"use client"

import * as React from "react"
import { lazy, Suspense, useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, Button, Spinner } from "@boffmedia/ui"
import { useCalculatorStore } from "../_store/calculatorStore"
import { useChampionsRegulations } from "../../meta/_hooks/useChampionsRegulations"
import { useCalcUrlSync } from "../_hooks/useCalcUrlSync"
import { CombatView } from "../_components/CombatView"

// Heavy tab views — code-split.
const MatrixView = lazy(() => import("../_components/MatrixView").then((m) => ({ default: m.MatrixView })))
const SpeedView = lazy(() => import("../_components/SpeedView").then((m) => ({ default: m.SpeedView })))
const TypesView = lazy(() => import("../_components/TypesView").then((m) => ({ default: m.TypesView })))
const SavedDrawer = lazy(() => import("../_components/SavedDrawer").then((m) => ({ default: m.SavedDrawer })))

type TabId = "combate" | "matriz" | "velocidad" | "tipos"

const REG_CARET: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)",
  backgroundPosition: "calc(100% - 16px) 55%, calc(100% - 11px) 55%",
  backgroundSize: "5px 5px",
  backgroundRepeat: "no-repeat",
}

function TabFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <Spinner />
    </div>
  )
}

function DamageCalcShell() {
  const t = useTranslations("vgc.calc")
  const { regulation, setRegulation, setUseChampions } = useCalculatorStore()
  const regs = useChampionsRegulations()
  const { copyShareLink, linkCopied } = useCalcUrlSync()

  const [tab, setTab] = useState<TabId>("combate")
  const [savedOpen, setSavedOpen] = useState(false)

  return (
    <div className="flex min-w-0 flex-col" style={{ minHeight: "calc(100dvh - var(--nav-h))" }}>
      {/* App bar */}
      <div className="sticky top-[var(--nav-h)] z-20 flex flex-none flex-wrap items-center gap-[18px] border-b border-solid border-line bg-base px-[clamp(18px,2.4vw,40px)] py-3">
        <Tabs
          value={tab}
          onChange={(v) => setTab(v as TabId)}
          className="min-w-0 flex-1 overflow-x-auto border-b-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          tabs={[
            { value: "combate", label: t("tabs.combate") },
            { value: "matriz", label: t("tabs.matriz") },
            { value: "velocidad", label: t("tabs.velocidad") },
            { value: "tipos", label: t("tabs.tipos") },
          ]}
        />
        <div className="flex flex-wrap items-center gap-2">
          {regs.length > 0 && (
            <select
              value={regulation}
              aria-label={t("title")}
              onChange={(e) => {
                setRegulation(e.target.value)
                setUseChampions(true)
              }}
              style={REG_CARET}
              className="cut-tag cut-tag-edge [--cut-line:var(--line-2)] [--cut-tag:8px] cursor-pointer appearance-none border border-solid border-line-2 bg-panel py-2 pl-3 pr-[30px] font-mono text-[12px]/none font-semibold tracking-[0.06em] text-txt-muted outline-none focus-visible:outline-2 focus-visible:outline-accent-line"
            >
              {regs.map((r) => (
                <option key={r.formatId} value={r.formatId}>
                  {r.name}
                </option>
              ))}
            </select>
          )}
          <Button size="sm" icon={linkCopied ? "check" : "link"} onClick={copyShareLink}>
            {linkCopied ? t("shareCopied") : t("share")}
          </Button>
          <Button size="sm" icon="bookmark" onClick={() => setSavedOpen((v) => !v)}>
            {t("ui.saved")}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-[clamp(18px,2.4vw,40px)] pb-[60px] pt-5">
        {tab === "combate" && <CombatView />}
        {tab === "matriz" && (
          <Suspense fallback={<TabFallback />}>
            <MatrixView />
          </Suspense>
        )}
        {tab === "velocidad" && (
          <Suspense fallback={<TabFallback />}>
            <SpeedView />
          </Suspense>
        )}
        {tab === "tipos" && (
          <Suspense fallback={<TabFallback />}>
            <TypesView />
          </Suspense>
        )}
      </div>

      {savedOpen && (
        <Suspense fallback={null}>
          <SavedDrawer onClose={() => setSavedOpen(false)} />
        </Suspense>
      )}
    </div>
  )
}

export function DamageCalculatorView() {
  return (
    <Suspense>
      <DamageCalcShell />
    </Suspense>
  )
}
