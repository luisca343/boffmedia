"use client"

import { useTranslations } from "next-intl"
import { Button, PageHead } from "../ui"
import { useOfficer } from "../../_hooks/useOfficer"
import { useBuscados } from "../../_hooks/queries"
import { useGobiernoUi } from "../../_stores/useGobiernoUi"
import { StatsRow } from "./StatsRow"
import { DenunciasCard } from "./DenunciasCard"
import { TesoreriaCard } from "./TesoreriaCard"
import { MasBuscadosCard } from "./MasBuscadosCard"
import { AnunciosCard } from "./AnunciosCard"
import { QuickActionsCard } from "./QuickActionsCard"

export function InicioView() {
  const t = useTranslations("gobierno")
  const { username, rankLabel } = useOfficer()
  const setCmdOpen = useGobiernoUi((s) => s.setCmdOpen)
  const { data: activos } = useBuscados({ status: "active", pageSize: 3 })
  const alertCount = activos?.total ?? 0

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })

  const h = new Date().getHours()
  const greeting = h < 12 ? t("inicio.greetingMorning") : h < 20 ? t("inicio.greetingAfternoon") : t("inicio.greetingEvening")

  return (
    <div className="animate-gt-pop motion-reduce:animate-none">
      <PageHead
        kicker={t("inicio.kicker", { date: today })}
        title={`${greeting}, ${rankLabel} ${username}`.trim()}
        sub={
          alertCount > 0
            ? t("inicio.summaryWithAlerts", { count: alertCount })
            : t("inicio.summaryNoAlerts")
        }
        dep="civic"
        right={
          <Button tone="ghost" icon="command" onClick={() => setCmdOpen(true)}>
            {t("common.search")} <span className="font-gt-mono text-[0.625rem] opacity-70">⌘K</span>
          </Button>
        }
      />

      <StatsRow />

      <div className="grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="grid gap-4">
          <DenunciasCard />
          <TesoreriaCard />
        </div>
        <div className="grid gap-4">
          <MasBuscadosCard />
          <AnunciosCard />
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
