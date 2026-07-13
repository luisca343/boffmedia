"use client"

import { useState } from "react"
import { Badge, Button, Empty, PageHead, Skeleton } from "../ui"
import { OficialCard } from "./OficialCard"
import { AppointModal } from "./AppointModal"
import { useOficiales } from "../../_hooks/queries"
import { useOfficer } from "../../_hooks/useOfficer"
import { rankOrder } from "./officerRoles"

export function OficialesBoard() {
  const { data: oficiales, isLoading } = useOficiales()
  const officer = useOfficer()
  const [appointOpen, setAppointOpen] = useState(false)

  const sorted = [...(oficiales ?? [])].sort((a, b) => rankOrder(b.rank?.role) - rankOrder(a.rank?.role))

  return (
    <div>
      <PageHead
        kicker="Población · Cuerpo de funcionarios"
        dep="poblacion"
        title="Oficiales"
        sub="Plantilla del Gobierno de Teras. La titularidad de cada cargo se rige por los roles concedidos — no existe una tabla de plantilla aparte."
        right={
          <div className="flex items-center gap-2">
            <Badge tone="poblacion" icon="badge">
              {oficiales?.length ?? "—"} en plantilla
            </Badge>
            {officer.isAdmin && (
              <Button tone="gold" icon="plus" onClick={() => setAppointOpen(true)}>
                Nombrar
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[132px]" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <Empty
          icon="badge"
          title="Sin funcionarios nombrados"
          sub="Todavía no se ha concedido ningún cargo de gobierno. Nombra al primer funcionario para empezar la plantilla."
        />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {sorted.map((o) => (
            <OficialCard key={o.uuid} oficial={o} isMe={o.uuid === officer.uuid} canManage={officer.isAdmin} />
          ))}
        </div>
      )}

      {appointOpen && <AppointModal onClose={() => setAppointOpen(false)} />}
    </div>
  )
}
