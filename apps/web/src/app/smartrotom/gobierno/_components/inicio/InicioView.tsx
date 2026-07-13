"use client"

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

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Buenos días"
  if (h < 20) return "Buenas tardes"
  return "Buenas noches"
}

export function InicioView() {
  const { username, rankLabel } = useOfficer()
  const setCmdOpen = useGobiernoUi((s) => s.setCmdOpen)
  // Same query/params as StatsRow and MasBuscadosCard — TanStack Query dedupes the request,
  // so the page-head alert count costs nothing extra over the tiles that already need it.
  const { data: activos } = useBuscados({ status: "active", pageSize: 3 })
  const alertCount = activos?.total ?? 0

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="animate-gt-pop motion-reduce:animate-none">
      <PageHead
        kicker={`Panel municipal · ${today}`}
        title={`${greeting()}, ${rankLabel} ${username}`.trim()}
        sub={
          alertCount > 0
            ? `Resumen del estado de la región de Teras. ${alertCount} ${alertCount === 1 ? "alerta activa requiere" : "alertas activas requieren"} atención.`
            : "Resumen del estado de la región de Teras."
        }
        dep="civic"
        right={
          <Button tone="ghost" icon="command" onClick={() => setCmdOpen(true)}>
            Buscar <span className="font-gt-mono text-[10px] opacity-70">⌘K</span>
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
