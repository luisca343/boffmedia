"use client"

import * as React from "react"
import { lazy, Suspense, useState } from "react"
import { useTranslations } from "next-intl"
import { Tabs, Button, Select, Spinner, ToolStrip } from "@boffmedia/ui"
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
      {/* App bar. An App surface: it deliberately carries NO title — the tool is
          named by ToolShell's rail, not by its own bar. ToolStrip sticks to
          `--tool-sticky-top`, so this no longer hardcodes `--nav-h`. */}
      <ToolStrip>
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
            <Select
              value={regulation}
              ariaLabel={t("title")}
              onChange={(v) => {
                setRegulation(v)
                setUseChampions(true)
              }}
              options={regs.map((r) => ({ value: r.formatId, label: r.name }))}
              // `Select` is full-width by default; in a bar that eats the row and
              // wraps the buttons onto a second line, doubling the bar's height.
              className="w-auto min-w-[190px]"
            />
          )}
          <Button size="sm" icon={linkCopied ? "check" : "link"} onClick={copyShareLink}>
            {linkCopied ? t("shareCopied") : t("share")}
          </Button>
          <Button size="sm" icon="bookmark" onClick={() => setSavedOpen((v) => !v)}>
            {t("ui.saved")}
          </Button>
        </div>
      </ToolStrip>

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
